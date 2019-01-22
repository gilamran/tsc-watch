const stripAnsi = require('strip-ansi');

const compilationCompleteRegex = /( Compilation complete\. Watching for file changes\.| Found \d+ error[s]?\. Watching for file changes\.)/;
const compilationStartedRegex = /Starting incremental compilation/;
const typescriptPrettyErrorRegex = /:\d+:\d+ \- error TS\d+: /;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+: /;
const typescriptWatchCommandRegex = /Watch input files\./;
const typescriptSuccessRegex = /Compilation complete|Found 0 errors/;

const newAdditionToSyntax = [
  'Watch input files. [always on]',
  ' --onSuccess COMMAND                                Run the COMMAND on each successful compilation',
  ' --onFirstSuccess COMMAND                           Run the COMMAND on the first successful compilation (Will not run the onSuccess)',
  ' --onFailure COMMAND                                Run the COMMAND on each failed compilation',
  ' --noColors                                         Removes the red/green colors from the compiler output',
  ' --noClear                                          Prevents the compiler from clearing the screen',
  ' --compiler PATH                                    The PATH will be used instead of typescript compiler. Defaults typescript/bin/tsc.',
].join('\n');

function color(line) {
  if (typescriptErrorRegex.test(line)) {
    return `\u001B[31m${line}\u001B[39m`; //Red
  }

  if (typescriptSuccessRegex.test(line) || typescriptWatchCommandRegex.test(line)) {
    return `\u001B[32m${line}\u001B[39m`; //Green
  }

  return line;
}

function print(noColors, lines) {
  return lines.forEach(line => console.log(noColors ? line : color(line)));
}

function removeColors(lines) {
  return lines.map(line => stripAnsi(line));
}

function isClear(buffer) {
  return buffer && buffer.length === 2 && buffer[0] === 0x1b && buffer[1] === 0x63;
}

function manipulate(buffer) {
  const lines = buffer
    .toString()
    .split('\n')
    .filter(a => a.length > 0)
    .map(a => a.replace(typescriptWatchCommandRegex, newAdditionToSyntax));

  return lines;
}

function detectState(lines) {
  const clearLines = removeColors(lines);
  const newCompilation = clearLines.some(line => compilationStartedRegex.test(line));
  const compilationError = clearLines.some(line => typescriptErrorRegex.test(line) || typescriptPrettyErrorRegex.test(line));
  const compilationComplete = clearLines.some(line => compilationCompleteRegex.test(line));

  return {
    newCompilation: newCompilation,
    compilationError: compilationError,
    compilationComplete: compilationComplete,
  };
}

module.exports = {
  print: print,
  isClear: isClear,
  manipulate: manipulate,
  detectState: detectState,
};
