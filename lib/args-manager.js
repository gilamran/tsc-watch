function removeRunnerArgs(args) {
  return args.splice(2); // removing "node tsc-watch.js"
}

function getCommandIdx(args, command) {
  const lowerCasedCommand = command.toLowerCase();
  return args.map(arg => arg.toLowerCase()).indexOf(lowerCasedCommand);
}

function isCommandExist(args, command) {
  return getCommandIdx(args, command) > 0;
}

function hasWatchCommand(args) {
  return isCommandExist(args, '-w') || isCommandExist(args, '--watch');
}

function forceWatch(args) {
  if (!hasWatchCommand(args)) {
    args.push('--watch');
  }

  return args;
}

function extractCommandWithValue(args, command) {
  let commandIdx = getCommandIdx(args, command);
  let commandValue = null;
  if (commandIdx > -1) {
    commandValue = args[commandIdx + 1];
    args.splice(commandIdx, 2);
  }
  return commandValue;
}

function getCommandValue(args, command) {
  let commandIdx = getCommandIdx(args, command);
  if (commandIdx > -1) {
    return args[commandIdx + 1];
  }
}

function extractCommand(args, command) {
  let commandIdx = getCommandIdx(args, command);
  if (commandIdx > -1) {
    args.splice(commandIdx, 1);
    return true;
  }
  return false;
}

function extractArgs(args) {
  const allArgs = forceWatch(removeRunnerArgs(args));

  const onFirstSuccessCommand = extractCommandWithValue(allArgs, '--onFirstSuccess');
  const onSuccessCommand = extractCommandWithValue(allArgs, '--onSuccess');
  const onFailureCommand = extractCommandWithValue(allArgs, '--onFailure');
  const noColors = extractCommand(allArgs, '--noColors');
  const noClear = extractCommand(allArgs, '--noClear');
  let compiler = extractCommandWithValue(allArgs, '--compiler');
  if (!compiler) {
    compiler = 'typescript/bin/tsc';
  }

  const project = getCommandValue(allArgs, '--project') || getCommandValue(allArgs, '-p');

  return {
    onFirstSuccessCommand: onFirstSuccessCommand,
    onSuccessCommand: onSuccessCommand,
    onFailureCommand: onFailureCommand,
    noColors: noColors,
    noClear: noClear,
    compiler: compiler,
    args: allArgs,
    project
  };
}

module.exports = {
  extractArgs: extractArgs,
  isCommandExist: isCommandExist,
  hasWatchCommand: hasWatchCommand,
};
