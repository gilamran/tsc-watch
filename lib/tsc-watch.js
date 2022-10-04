#!/usr/bin/env node

'use strict';
const nodeCleanup = require('node-cleanup');
const spawn = require('cross-spawn');
const run = require('./runner');
const { extractArgs } = require('./args-manager');
const { manipulate, detectState, deleteClear, print } = require('./stdout-manipulator');
const readline = require('readline');

/**
 * Represents a command that can be executed in response to a compilation event.
 * Used by CommandRunner to manage the lifecycle of the process that executes the command.
 */
class Command
{
  killer = null;

  /**
   * @param {*} command A function returning the function that runs the command.
   * @param {*} signal The name of the signal to emit when this command is run.
   */
  constructor(command, signal)
  {
    this.command = command;
    this.signal = signal;
  }

  /**
   * Start running the command.
   * This must not be called while the command is already running.
   * @param {boolean} emitSignal If true, emit a signal to indicate that the command has been started.
   */
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

  /**
   * Kill the running command.
   * @returns A Promise that resolves when the command has been killed.
   */
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

/**
 * Manages the process lifecycle of the various commands that run in response to compilation events.
 * One or more commands can be run concurrently, e.g. if a single compilation results in multiple events.
 * See the documentation for {CommandRunner.run()} for more information.
 */
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

  /**
   * Start running the given set of commands.
   * If commands are already running, these will be killed first. (Even if the already running commands are identical to the new ones.)
   * @param {*} commands An array of `Command`s to run.
   * @param {boolean} isTriggeredByClient If true, this event was triggered by the `tsc-watch` client API, rather than an actual compilation event. 
   */
  run({ commands, isTriggeredByClient })
  {
    this._setDesiredState({ state: 'running', commands, isTriggeredByClient, runID: this.nextRunID++ });
  }

  /**
   * Kill all running commands in preparation for process shutdown.
   */
  async shutdown()
  {
    await this._kill();
  }

  /**
   * Set the desired state of the CommandRunner.
   * This indicates which commands it should be running, if any.
   * It is safe to call this at any time without worrying about the current state of the commands.
   * @param {*} desiredState The new desired state.
   * Note: `{ state: 'killing' }` is not a valid desired state - to kill a running process, set the desired
   * state to `{ state: 'not_running' }`, and the state machine will transition to `not_running` via `killing`.
   */
  _setDesiredState(desiredState)
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
        // running -> running
        // We're already running some commands, and now we want to run some new ones.
        // Need to kill the old commands first.
        this._kill();
      }
      else if (this.currentState.state === 'not_running')
      {
        // not_running -> running
        // We're not currently running anything, and we want to run some commands.
        // We can go ahead and run them.
        this._run(this.desiredState);
      }
    }
    else if (this.desiredState.state === 'not_running')
    {
      if (this.currentState.state === 'running')
      {
        // running -> not_running
        // We're currently running commands, and we don't want to be.
        // Need to kill the commands that are running.
        this._kill();
      }
    }
  }

  /**
   * Implements the transition from the `not_running` state to the `running` state.
   * @param {*} state The data for the new state.
   */
  _run({ commands, isTriggeredByClient, runID })
  {
    this.currentState = { state: 'running', commands, isTriggeredByClient, runID };
    for (const command of commands)
    {
      command.run({ emitSignal: true });
    }
    this._stateMachine();
  }

  /**
   * Implements the transition from the `running` state to the `killing` state.
   * Then, when killing is complete, transitions into the `not_running` state.
   */
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
