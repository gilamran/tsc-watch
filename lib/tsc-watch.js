#!/usr/bin/env node

'use strict';
const nodeCleanup = require('node-cleanup');
const spawn = require('cross-spawn');
const run = require('./runner');
const { extractArgs } = require('./args-manager');
const { manipulate, detectState, isClear, print } = require('./stdout-manipulator');

let firstTime = true;
let firstSuccessKiller = null;
let successKiller = null;
let failureKiller = null;

const {
  onFirstSuccessCommand,
  onSuccessCommand,
  onFailureCommand,
  noColors,
  noClear,
  compiler,
  args,
} = extractArgs(process.argv);

function killProcesses(killAll) {
  return Promise.all([
    killAll && firstSuccessKiller ? firstSuccessKiller() : null,
    successKiller ? successKiller() : null,
    failureKiller ? failureKiller() : null,
  ]);
}

let bin;
try {
  bin = require.resolve(compiler);
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error(e.message);
    process.exit(9);
  }
  throw e;
}

const tscProcess = spawn(bin, [...args]);
tscProcess.stdout.on('data', buffer => {
  if (noClear && isClear(buffer)) {
    return;
  }

  const lines = manipulate(buffer);
  print(noColors, noClear, lines);
  const state = detectState(lines);
  const compilationError = state.compilationError;
  const compilationComplete = state.compilationComplete;

  if (compilationComplete) {
    killProcesses(false).then(() => {
      if (compilationError) {
        Signal.emitFail();
        if (onFailureCommand) {
          failureKiller = run(onFailureCommand);
        }
      } else {
        Signal.emitSuccess();
        if (firstTime && onFirstSuccessCommand) {
          firstTime = false;
          firstSuccessKiller = run(onFirstSuccessCommand);
        } else if (onSuccessCommand) {
          successKiller = run(onSuccessCommand);
        }
      }
    });
  }
});

const Signal = {
  send: typeof process.send === 'function' ? (...e) => process.send(...e) : () => {},
  _successStr: 'first_success',
  emitSuccess: () => {
    Signal.send(Signal._successStr);
    Signal._successStr = 'subsequent_success';
  },

  emitFail: () => Signal.send('compile_errors'),
};

var cleanupCompleted = false;
nodeCleanup((_exitCode, signal) => {
  if (cleanupCompleted) {
    return true;
  }

  var promise = killProcesses(true);
  
  // we must wait for the processes to be killed
  promise.then(function() {
    cleanupCompleted = true;

    // perform the actions which are actually performed by node-cleanup (L.60-66)
    
    // we do not have access to the messages object in node-cleanup
    // actually I do not know what the following code is good for
    //if (signal === 'SIGINT' && messages && messages.ctrl_C !== '')
      //process.stderr.write(messages.ctrl_C + "\n");

    // the following is accomplished by the cleanupCompleted guard above
    //uninstall(); // don't cleanup again

    // necessary to communicate the signal to the parent process
    process.kill(process.pid, signal);
  });

  tscProcess.kill(signal);

  // IMPORTANT: explicitly return false to prevent from immediate exit
  return false;
});
