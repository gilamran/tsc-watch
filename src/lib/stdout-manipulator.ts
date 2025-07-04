const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  'g',
);
const stripAnsi = (str: string) => str.replace(ANSI_REGEX, '');

const tscUsageSyntaxRegex = / -w, --watch.*Watch input files\./;
const typescriptPrettyErrorRegex = /:\d+:\d+ \- error TS\d+: /;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+: /;
const typescriptEmittedFileRegex = /(TSFILE:)\s*(.*)/;

// errors
const compilationCompleteWithErrorRegex =
  / Found [^0][0-9]* error[s]?\. Watching for file changes\./;
const nativeCompilationCompleteWithErrorRegex = /Found [^0]?\d* error[s]? in /;

// no errors
const compilationCompleteWithoutErrorRegex = / Found 0 errors\. Watching for file changes\./;

// compilation started
const compilationStartedRegex =
  /( Starting compilation in watch mode\.\.\.| File change detected\. Starting incremental compilation\.\.\.)/;

const nativeCompilationStartedRegex = /build starting at /;

// compilation complete
const compilationCompleteRegex =
  /( Compilation complete\. Watching for file changes\.| Found \d+ error[s]?\. Watching for file changes\.)/;

const nativeCompilationCompleteRegex = /build finished in /;

const newAdditionToSyntax = [
  ' -w, --watch                                        Watch input files. [on by default, use --noWatch to disable]',
  ' --onSuccess COMMAND                                Executes `COMMAND` on **every successful** compilation.',
  ' --onFirstSuccess COMMAND                           Executes `COMMAND` on the **first successful** compilation.',
  ' --onFailure COMMAND                                Executes `COMMAND` on **every failed** compilation.',
  ' --onEmit COMMAND                                   Executes debounced `COMMAND` on **every emitted file**, ignoring unchanged files and disregards compilation success or failure.',
  ' --onEmitDebounceMs DELAY                           Delay by which to debounce `--onEmit` (default: 300).',
  ' --onCompilationStarted COMMAND                     Executes `COMMAND` on **every compilation start** event.',
  ' --onCompilationComplete COMMAND                    Executes `COMMAND` on **every successful or failed** compilation.',
  ' --noColors                                         Removes the red/green colors from the compiler output',
  ' --noClear                                          Prevents the compiler from clearing the screen',
  ' --compiler PATH                                    The PATH will be used instead of typescript compiler. Defaults typescript/bin/tsc.',
].join('\n');

function color(line: string, noClear: boolean = false): string {
  // coloring errors:
  line = line.replace(typescriptErrorRegex, (m) => `\u001B[36m${m}\u001B[39m`); // Cyan
  line = line.replace(typescriptPrettyErrorRegex, (m) => `\u001B[36m${m}\u001B[39m`); // Cyan

  // completed with error:
  line = line.replace(compilationCompleteWithErrorRegex, (m) => `\u001B[31m${m}\u001B[39m`); // Red
  line = line.replace(nativeCompilationCompleteWithErrorRegex, (m) => `\u001B[31m${m}\u001B[39m`); // Red

  // completed without error:
  line = line.replace(compilationCompleteWithoutErrorRegex, (m) => `\u001B[32m${m}\u001B[39m`); // Green

  // usage
  line = line.replace(tscUsageSyntaxRegex, (m) => `\u001B[33m${m}\u001B[39m`); // Yellow

  if (noClear && compilationStartedRegex.test(line)) {
    return '\n\n----------------------\n' + line;
  }

  return line;
}

type TPrintParams = {
  noColors?: boolean;
  noClear?: boolean;
  requestedToListEmittedFiles?: boolean;
  signalEmittedFiles?: boolean;
};

export function print(
  line: string,
  {
    noColors = false,
    noClear = false,
    requestedToListEmittedFiles = false,
    signalEmittedFiles = false,
  }: TPrintParams = {},
): void {
  if (signalEmittedFiles && !requestedToListEmittedFiles && line.startsWith('TSFILE:')) {
    return;
  }

  console.log(noColors ? line : color(line, noClear));
}

export function deleteClear(line: string): string {
  // '\x1bc11:40:16 - Starting compilation in watch mode...'
  // '\x1b[2J\x1b[3J\x1b[H11:33:28 - Starting compilation in watch mode...'
  const result = line
    .replace(/^\x1b\[2J/, '')
    .replace(/^\x1b\[3J/, '')
    .replace(/^\x1b\[H/, '')
    .replace(/^\x1bc/, '');
  return result;
}

export function manipulate(line: string): string {
  return line.replace(tscUsageSyntaxRegex, newAdditionToSyntax);
}

export function detectState(line: string) {
  const clearLine = stripAnsi(line);
  const compilationStarted =
    compilationStartedRegex.test(clearLine) || nativeCompilationStartedRegex.test(clearLine);

  const compilationError =
    compilationCompleteWithErrorRegex.test(clearLine) ||
    nativeCompilationCompleteWithErrorRegex.test(clearLine) ||
    typescriptErrorRegex.test(clearLine) ||
    typescriptPrettyErrorRegex.test(clearLine);

  const compilationComplete =
    compilationCompleteRegex.test(clearLine) || nativeCompilationCompleteRegex.test(clearLine);
  const fileEmittedExec = typescriptEmittedFileRegex.exec(clearLine);
  const fileEmitted = fileEmittedExec !== null ? fileEmittedExec[2] : null; // if the regex is not null it will return an array with 3 elements

  return {
    compilationStarted,
    compilationError,
    compilationComplete,
    fileEmitted,
  };
}
