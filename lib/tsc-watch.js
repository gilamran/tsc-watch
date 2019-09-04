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

let compilationErrorSinceStart = false;
const tscProcess = spawn(bin, [...args]);
tscProcess.stdout.on('data', buffer => {
  if (noClear && isClear(buffer)) {
    return;
  }

  const lines = manipulate(buffer);
  print(noColors, noClear, lines);
  const state = detectState(lines);
  const newCompilation = state.newCompilation;
  const compilationError = state.compilationError;
  const compilationComplete = state.compilationComplete;

  compilationErrorSinceStart = (!newCompilation && compilationErrorSinceStart) || compilationError;

  if (compilationComplete) {
    killProcesses(false).then(() => {
      if (compilationErrorSinceStart) {
        Signal.emitFail();
        if (onFailureCommand) {
          failureKiller = run(onFailureCommand);
        }
      } else {
        if (firstTime) {
          firstTime = false;
          Signal.emitFirstSuccess();
          if (onFirstSuccessCommand) {
            firstSuccessKiller = run(onFirstSuccessCommand);
          }
        }
        
        Signal.emitSuccess();
        if (onSuccessCommand) {
          successKiller = run(onSuccessCommand);
        }
      }
    });
  }
});

const Signal = {
  send: typeof process.send === 'function' ? (...e) => process.send(...e) : () => {},
  emitFirstSuccess: () => Signal.send('first_success'),
  emitSuccess: () => Signal.send('success'),
  emitFail: () => Signal.send('compile_errors'),
};

nodeCleanup((_exitCode, signal) => {
  tscProcess.kill(signal);
  killProcesses(true).then(() => process.exit());
  // don't call cleanup handler again
  nodeCleanup.uninstall();
  return false;
});
