#!/usr/bin/env node

'use strict';
const killer = require('./killer');
const nodeCleanup = require('node-cleanup');
const spawn = require('cross-spawn');
const stripAnsi = require('strip-ansi');
const stringArgv = require('string-argv');

const compilationStartedRegex = /Starting incremental compilation/;
const compilationCompleteRegex = /( Compilation complete\. Watching for file changes\.| Found \d+ error[s]?\. Watching for file changes\.)/;
const typescriptSuccessRegex = /Compilation complete|Found 0 errors/;
const typescriptWatchCommandRegex = /Watch input files\./;
const typescriptPrettyErrorRegex = /:\d+:\d+ \- error TS\d+: /;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+: /;
const onSuccessCommandSyntax = ' --onSuccess COMMAND                                Run the COMMAND on each successful compilation';
const onFirstSuccessCommandSyntax = ' --onFirstSuccess COMMAND                           Run the COMMAND on the first successful compilation (Will not run the onSuccess)';
const onFailureCommandSyntax = ' --onFailure COMMAND                                Run the COMMAND on each failed compilation';
const newAdditionToSyntax = ['Watch input files. [always on]', onSuccessCommandSyntax, onFirstSuccessCommandSyntax, onFailureCommandSyntax].join('\n');

let hadErrors = false;
let firstTime = true;
let firstSuccessProcess = null;
let firstSuccessProcessExited = null;
let successProcess = null;
let successProcessExited = null;
let failureProcess = null;
let failureProcessExited = null;

function color(line) {
  if (typescriptErrorRegex.test(line)) {
    return `\u001B[31m${line}\u001B[39m`; //Red
  }

  if (typescriptSuccessRegex.test(line) || typescriptWatchCommandRegex.test(line)) {
    return `\u001B[32m${line}\u001B[39m`; //Green
  }

  return line;
}

function print(lines) {
  return lines.forEach(line => console.log(noColors ? line : color(line)));
}

function removeColors(lines) {
  return lines.map(line => stripAnsi(line));
}

function processArgs(inputArgs) {
  const result = inputArgs
    .splice(2)
    .map(arg => arg.toLowerCase())
    .filter(arg => arg !== '-w')
    .filter(arg => arg !== '--watch')
    .filter(arg => arg !== '--compiler')
    .filter(arg => arg !== '--nocolors')
    .filter(arg => arg !== '--noclear')
    .filter(arg => arg !== '--onsuccess')
    .filter(arg => arg !== '--onfailure')
    .filter(arg => arg !== '--onfirstsuccess');

  result.push('--watch'); // force watch
  return result;
}

function getCommandIdx(inputArgs, command) {
  return inputArgs.indexOf(command);
}

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

function getCustomeCommand(commandStr) {
  const allArgs = process.argv;
  let onCommandIdx = getCommandIdx(allArgs, commandStr);
  let resultCommand = null;
  if (onCommandIdx > -1) {
    resultCommand = allArgs[onCommandIdx + 1];
    allArgs.splice(onCommandIdx, 2);
  }
  return resultCommand;
}

const onFirstSuccessCommand = getCustomeCommand('--onFirstSuccess');
const onSuccessCommand = getCustomeCommand('--onSuccess');
const onFailureCommand = getCustomeCommand('--onFailure');
const noColors = getCommandIdx(process.argv, '--noColors') > -1;
const noClear = getCommandIdx(process.argv, '--noClear') > -1;
let compiler = getCustomeCommand('--compiler');
if (!compiler) {
  compiler = 'typescript/bin/tsc';
}

const args = processArgs(process.argv);

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

function isClear(buffer) {
  return buffer && buffer.length === 2 && buffer[0] === 0x1b && buffer[1] === 0x63;
}
const tscProcess = spawn(bin, [...args]);
tscProcess.stdout.on('data', buffer => {
  if (noClear && isClear(buffer)) {
    console.log('\n');
    return;
  }

  const lines = buffer
    .toString()
    .split('\n')
    .filter(a => a.length > 0)
    .map(a => a.replace(typescriptWatchCommandRegex, newAdditionToSyntax));

  print(lines);
  const cleanLines = removeColors(lines);
  const newCompilation = cleanLines.some(line => compilationStartedRegex.test(line));
  if (newCompilation) {
    hadErrors = false;
  }

  const error = cleanLines.some(line => typescriptErrorRegex.test(line) || typescriptPrettyErrorRegex.test(line));
  if (error) {
    hadErrors = true;
  }

  const compilationComplete = cleanLines.some(line => compilationCompleteRegex.test(line));
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
