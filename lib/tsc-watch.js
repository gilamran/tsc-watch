#!/usr/bin/env node

'use strict';
const nodeCleanup = require('node-cleanup');
const spawn = require('cross-spawn');
const run = require('./runner');
const { extractArgs } = require('./args-manager');
const { manipulate, detectState, deleteClear, print } = require('./stdout-manipulator');
const readline = require('readline');

class Command
{
  killer = null;

  constructor(command, signal)
  {
    this.command = command;
    this.signal = signal;
  }

  run({ emitSignal })
  {
    const command = this.command();

    if (command)
    {
      this.killer = run(this.command());
    }

    if (emitSignal)
    {
      Signal.send(this.signal);
    }
  }

  kill()
  {
    const killer = this.killer;
    this.killer = null;

    if (killer)
    {
      return killer();
    }

    return Promise.resolve();
  }
}

class CommandRunner
{
  commands = {
    firstSuccess: new Command(() => onFirstSuccessCommand, 'first_success'),
    success: new Command(() => onSuccessCommand, 'success'),
    failure: new Command(() => onFailureCommand, 'compile_errors'),
    compilationStarted: new Command(() => onCompilationStarted, 'started'),
    compilationComplete: new Command(() => onCompilationComplete, 'complete'),
  }

  currentState = { state: 'not_running' };
  desiredState = { state: 'not_running' };
  nextRunID = 1;

  run({ commands, isTriggeredByClient })
  {
    this.setDesiredState({ state: 'running', commands, isTriggeredByClient, runID: this.nextRunID++ });
  }

  async shutdown()
  {
    await this._kill();
  }

  setDesiredState(desiredState)
  {
    this.desiredState = desiredState;
    this._stateMachine();
  }

  _stateMachine()
  {
    if (this.desiredState.state === 'running')
    {
      if (this.currentState.state === 'running' && this.currentState.runID !== this.desiredState.runID)
      {
        this._kill();
      }
      else if (this.currentState.state === 'not_running')
      {
        this._run(this.desiredState);
      }
    }
    else if (this.desiredState.state === 'not_running')
    {
      if (this.currentState.state === 'running')
      {
        this._kill();
      }
    }
  }

  _run({ commands, isTriggeredByClient, runID })
  {
    this.currentState = { state: 'running', commands, isTriggeredByClient, runID };
    for (const command of commands)
    {
      command.run({ emitSignal: true });
    }
    this._stateMachine();
  }

  async _kill()
  {
    this.currentState = { state: 'killing' };
    await Promise.all(Object.values(this.commands).map(c => c.kill()));
    this.currentState = { state: 'not_running' };
    this._stateMachine();
  }
}

const commandRunner = new CommandRunner();

let firstTime = true;

const {
  onFirstSuccessCommand,
  onSuccessCommand,
  onFailureCommand,
  onCompilationStarted,
  onCompilationComplete,
  maxNodeMem,
  noColors,
  noClear,
  silent,
  compiler,
  args,
} = extractArgs(process.argv);

function buildNodeParams(allArgs, { maxNodeMem }){
  let tscBin;
  try {
    tscBin = require.resolve(compiler);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(e.message);
      process.exit(9);
    }
    throw e;
  }

  return [
    ...((maxNodeMem) ? [`--max_old_space_size=${maxNodeMem}`] : []),
    tscBin,
    ...allArgs,
  ];
}

let compilationErrorSinceStart = false;
const tscProcess = spawn('node', buildNodeParams(args, { maxNodeMem }));
const rl = readline.createInterface({
  input: tscProcess.stdout,
});

rl.on('line', function (input) {
  if (noClear) {
    input = deleteClear(input);
  }

  const line = manipulate(input);
  if (!silent) {
    print(noColors, noClear, line);
  }
  const state = detectState(line);
  const compilationStarted = state.compilationStarted;
  const compilationError = state.compilationError;
  const compilationComplete = state.compilationComplete;

  compilationErrorSinceStart = (!compilationStarted && compilationErrorSinceStart) || compilationError;

  if (state.fileEmitted !== null){
    Signal.emitFile(state.fileEmitted);
  }

  let commands = [];

  if (compilationStarted) {
    commands.push(commandRunner.commands.compilationStarted);
  }

  if (compilationComplete) {
    commands.push(commandRunner.commands.compilationComplete);

    if (compilationErrorSinceStart)
    {
      commands.push(commandRunner.commands.failure);
    }
    else
    {
      if (firstTime)
      {
        firstTime = false;
        commands.push(commandRunner.commands.firstSuccess);
      }

      commands.push(commandRunner.commands.success);
    }
  }

  if (commands.length > 0)
  {
    commandRunner.run({ isTriggeredByClient: false, commands });
  }
});

if (typeof process.on === 'function') {
  process.on('message', (msg) => {
    let command = null;
    switch (msg) {
      case 'run-on-compilation-started-command':
        command = commandRunner.commands.compilationStarted;
        break;

      case 'run-on-compilation-complete-command':
        command = commandRunner.commands.compilationComplete;
        break;

      case 'run-on-first-success-command':
        command = commandRunner.commands.firstSuccess;
        break;

      case 'run-on-failure-command':
        command = commandRunner.commands.failure;
        break;

      case 'run-on-success-command':
        command = commandRunner.commands.success;
        break;

      default:
        console.log('Unknown message', msg);
    }

    if (command)
    {
      commandRunner.run({ commands: [command], isTriggeredByClient: true });
    }
  });
}

const Signal = {
  send: typeof process.send === 'function' ? (...e) => process.send(...e) : () => { },
  emitFile: (path) => Signal.send(`file_emitted:${path}`),
};

nodeCleanup((_exitCode, signal) => {
  tscProcess.kill(signal);
  commandRunner.shutdown().finally(process.exit());
  // don't call cleanup handler again
  nodeCleanup.uninstall();
  return false;
});
