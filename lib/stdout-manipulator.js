const stripAnsi = require('strip-ansi');

const tscUsageSyntaxRegex = / -w, --watch.*Watch input files\./;
const typescriptPrettyErrorRegex = /:\d+:\d+ \- error TS\d+: /;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+: /;

const compilationCompleteWithErrorRegex = / Found [^0][0-9]* error[s]?\. Watching for file changes\./;
const compilationCompleteWithoutErrorRegex = / Found 0 errors\. Watching for file changes\./;
const compilationCompleteRegex = /( Compilation complete\. Watching for file changes\.| Found \d+ error[s]?\. Watching for file changes\.)/;
const newCompilationRegex = /( Starting compilation in watch mode\.\.\.| File change detected\. Starting incremental compilation\.\.\.)/;

const newAdditionToSyntax = [
  ' -w, --watch                                        Watch input files. [always on]',
  ' --onSuccess COMMAND                                Run the COMMAND on each successful compilation',
  ' --onFirstSuccess COMMAND                           Run the COMMAND on the first successful compilation (Will not run the onSuccess)',
  ' --onFailure COMMAND                                Run the COMMAND on each failed compilation',
  ' --noColors                                         Removes the red/green colors from the compiler output',
  ' --noClear                                          Prevents the compiler from clearing the screen',
  ' --compiler PATH                                    The PATH will be used instead of typescript compiler. Defaults typescript/bin/tsc.',
].join('\n');

function color(line, noClear) {
  // coloring errors:
  line = line.replace(typescriptErrorRegex, m => `\u001B[36m${m}\u001B[39m`);  // Cyan
  line = line.replace(typescriptPrettyErrorRegex, m => `\u001B[36m${m}\u001B[39m`);  // Cyan

  // completed with error:
  line = line.replace(compilationCompleteWithErrorRegex, m => `\u001B[31m${m}\u001B[39m`);  // Red

  // completed without error:
  line = line.replace(compilationCompleteWithoutErrorRegex, m => `\u001B[32m${m}\u001B[39m`);  // Green

  // usage
  line = line.replace(tscUsageSyntaxRegex, m => `\u001B[33m${m}\u001B[39m`);  // Yellow

  if (noClear && newCompilationRegex.test(line)) {
    return '\n\n----------------------\n' + line;
  }

  return line;
}

function print(noColors, noClear, lines) {
  return lines.forEach(line => console.log(noColors ? line : color(line, noClear)));
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
    .map(a => a.replace(tscUsageSyntaxRegex, newAdditionToSyntax));

  return lines;
}

function detectState(lines) {
  const clearLines = removeColors(lines);
  const newCompilation = clearLines.some(line => newCompilationRegex.test(line));
  const compilationError = clearLines.some(
    line =>
      compilationCompleteWithErrorRegex.test(line) ||
      typescriptErrorRegex.test(line) ||
      typescriptPrettyErrorRegex.test(line)
  );
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
