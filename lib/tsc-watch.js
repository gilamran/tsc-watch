#!/usr/bin/env node

'use strict';
const killer = require('./killer');
const nodeCleanup = require('node-cleanup');
const spawn = require('cross-spawn');
const stringArgv = require('string-argv');
const { extractArgs } = require('./args-manager');
const { manipulate, isClear } = require('./stdout-manipulator');

const compilationCompleteRegex = /( Compilation complete\. Watching for file changes\.| Found \d+ error[s]?\. Watching for file changes\.)/;
const compilationStartedRegex = /Starting incremental compilation/;
const typescriptPrettyErrorRegex = /:\d+:\d+ \- error TS\d+: /;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+: /;

let hadErrors = false;
let firstTime = true;
let firstSuccessProcess = null;
let firstSuccessProcessExited = null;
let successProcess = null;
let successProcessExited = null;
let failureProcess = null;
let failureProcessExited = null;

let { onFirstSuccessCommand, onSuccessCommand, onFailureCommand, noColors, noClear, compiler, args } = extractArgs(process.argv);
function runCommand(fullCommand) {
  if (fullCommand) {
    const parts = stringArgv(fullCommand);
    const exec = parts[0];
    const args = parts.splice(1);
    return spawn(exec, args, {
      stdio: 'inherit',
    });
  }
}

function killAllProcesses() {
  return Promise.all([killAllSuccessProcesses(), killFailureProcess()]);
}

function killAllSuccessProcesses() {
  const promises = [];
  if (firstSuccessProcess) {
    promises.push(killer(firstSuccessProcess).then(() => (firstSuccessProcess = null)));
    promises.push(firstSuccessProcessExited.then(() => (firstSuccessProcessExited = null)));
  }

  if (successProcess) {
    promises.push(killer(successProcess).then(() => (successProcess = null)));
    promises.push(successProcessExited.then(() => (successProcessExited = null)));
  }

  return Promise.all(promises);
}

function killFailureProcess() {
  const promises = [];

  if (failureProcess) {
    promises.push(killer(failureProcess).then(() => (failureProcess = null)));
    promises.push(failureProcessExited.then(() => (failureProcessExited = null)));
  }

  return Promise.all(promises);
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

  const lines = manipulate(noColors, buffer);
  const newCompilation = lines.some(line => compilationStartedRegex.test(line));
  if (newCompilation) {
    hadErrors = false;
  }

  const error = lines.some(line => typescriptErrorRegex.test(line) || typescriptPrettyErrorRegex.test(line));
  if (error) {
    hadErrors = true;
  }

  const compilationComplete = lines.some(line => compilationCompleteRegex.test(line));
  if (compilationComplete) {
    killAllProcesses().then(() => {
      if (hadErrors) {
        Signal.emitFail();
        if (onFailureCommand) {
          failureProcess = runCommand(onFailureCommand);
          failureProcessExited = new Promise(resolve => {
            failureProcess.on('exit', code => {
              resolve(code);
            });
          });
        }
      } else {
        Signal.emitSuccess();
        if (firstTime && onFirstSuccessCommand) {
          firstTime = false;
          firstSuccessProcess = runCommand(onFirstSuccessCommand);
          firstSuccessProcessExited = new Promise(resolve => {
            firstSuccessProcess.on('exit', code => {
              resolve(code);
            });
          });
        } else if (onSuccessCommand) {
          successProcess = runCommand(onSuccessCommand);
          successProcessExited = new Promise(resolve => {
            successProcess.on('exit', code => {
              resolve(code);
            });
          });
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

nodeCleanup((_exitCode, signal) => {
  killAllProcesses();
  tscProcess.kill(signal);
});
