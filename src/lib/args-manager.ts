import { getCompilerPath } from "./compiler-provider";

function removeRunnerArgs(args: string[]): string[] {
  return args.splice(2); // removing "node tsc-watch.js"
}

function getCommandIdx(args: string[], command: string): number {
  const lowerCasedCommand = command.toLowerCase();
  return args.map((arg) => arg.toLowerCase()).indexOf(lowerCasedCommand);
}

export function isCommandExist(args: string[], command: string): boolean {
  return getCommandIdx(args, command) >= 0;
}

export function hasWatchCommand(args: string[]): boolean {
  return isCommandExist(args, '-w') || isCommandExist(args, '--watch');
}

function forceWatch(args: string[]): string[] {
  if (!hasWatchCommand(args)) {
    args.push('--watch');
  }

  return args;
}

function extractCommandWithValue(args: string[], command: string): string | null {
  let commandValue = null;
  let commandIdx = getCommandIdx(args, command);
  if (commandIdx > -1) {
    commandValue = args[commandIdx + 1];
    args.splice(commandIdx, 2);
  }
  return commandValue;
}

function extractCommand(args: string[], command: string): boolean {
  let commandIdx = getCommandIdx(args, command);
  if (commandIdx > -1) {
    args.splice(commandIdx, 1);
    return true;
  }
  return false;
}

export function extractArgs(inputArgs: string[]) {
  const cleanArgs = removeRunnerArgs(inputArgs);
  const noWatch = extractCommand(cleanArgs, '--noWatch');
  const args = noWatch ? cleanArgs : forceWatch(cleanArgs);

  const onFirstSuccessCommand = extractCommandWithValue(args, '--onFirstSuccess');
  const onSuccessCommand = extractCommandWithValue(args, '--onSuccess');
  const onFailureCommand = extractCommandWithValue(args, '--onFailure');
  const onEmitCommand = extractCommandWithValue(args, '--onEmit');
  const onEmitDebounceMs = Number(extractCommandWithValue(args, '--onEmitDebounceMs')) || 300;
  const onCompilationStarted = extractCommandWithValue(args, '--onCompilationStarted');
  const onCompilationComplete = extractCommandWithValue(args, '--onCompilationComplete');
  const maxNodeMem = extractCommandWithValue(args, '--maxNodeMem');
  const noColors = extractCommand(args, '--noColors');
  const noClear = extractCommand(args, '--noClear');
  const silent = extractCommand(args, '--silent');
  const signalEmittedFiles = extractCommand(args, '--signalEmittedFiles');
  const requestedToListEmittedFiles = extractCommand(args, '--listEmittedFiles');
  const compiler = getCompilerPath(extractCommandWithValue(args, '--compiler'));

  
  if (signalEmittedFiles || requestedToListEmittedFiles) {
    if (args[0] === '--build' || args[0] === '-b') {
      // TS6369: Option '--build' must be the first command line argument.
      args.splice(1, 0, '--listEmittedFiles');
    } else {
      args.unshift('--listEmittedFiles');
    }
  }

  return {
    onFirstSuccessCommand,
    onSuccessCommand,
    onFailureCommand,
    onEmitCommand,
    onEmitDebounceMs,
    onCompilationStarted,
    onCompilationComplete,
    maxNodeMem,
    noColors,
    noClear,
    requestedToListEmittedFiles,
    signalEmittedFiles,
    silent,
    compiler,
    args,
  };
}
