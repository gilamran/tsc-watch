import { extractArgs } from '../lib/args-manager';

describe('Args Manager', () => {
  it('Should remove the runner args', () => {
    const { args } = extractArgs(['node', 'tsc-watch.js', '-d', '1.ts']);
    expect(args).toEqual(['-d', '1.ts', '--watch']);
  });

  it('Should remove custom args', () => {
    const { args } = extractArgs([
      'node',
      'tsc-watch.js',
      '--compiler',
      'typescript/bin/tsc',
      '--nocolors',
      '--noclear',
      '--onsuccess',
      'MY_SUCCESS',
      '--onfailure',
      'MY_FAILURE',
      '--onfirstsuccess',
      'MY_FIRST',
      '-d',
      '1.ts',
    ]);
    expect(args).toEqual(['-d', '1.ts', '--watch']);
  });

  it('Should force watch', () => {
    const { args } = extractArgs(['node', 'tsc-watch.js', '1.ts']);
    expect(args.indexOf('--watch')).toBeGreaterThan(-1);
  });

  it('Should not change the argv order options if watch was not specified (fixes --build option)', () => {
    const { args } = extractArgs([
      'node',
      'tsc-watch.js',
      '--build',
      '1.tsconfig.conf',
      '2.tsconfig.conf',
    ]);
    expect(args.indexOf('--build')).toBe(0);
    expect(args.indexOf('--watch')).toBe(3);
  });

  it('Should not insert args before --build (TS6369)', () => {
    const { args } = extractArgs([
      'node',
      'tsc-watch.js',
      '--signalEmittedFiles',
      '--build',
      '1.tsconfig.conf',
      '2.tsconfig.conf',
    ]);
    expect(args.indexOf('--build')).toBe(0);
    expect(args.indexOf('--listEmittedFiles')).toBe(1);
  })

  it('Should not re-add watch', () => {
    expect(
      extractArgs(['node', 'tsc-watch.js', '-w', '1.ts']).args.indexOf('-w'),
    ).toBeGreaterThan(-1);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--watch', '1.ts']).args.indexOf('--watch'),
    ).toBeGreaterThan(-1);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--watch', '1.ts']).args.indexOf('--watch'),
    ).toBeGreaterThan(-1);
  });

  it('Should return the onFirstSuccessCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onFirstSuccessCommand).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onFirstSuccess', 'COMMAND_TO_RUN', '1.ts'])
        .onFirstSuccessCommand,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the onSuccessCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onSuccessCommand).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onSuccess', 'COMMAND_TO_RUN', '1.ts'])
        .onSuccessCommand,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the onFailureCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onFailureCommand).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onFailure', 'COMMAND_TO_RUN', '1.ts'])
        .onFailureCommand,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the onCompilationStarted', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onCompilationStarted).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onCompilationStarted', 'COMMAND_TO_RUN', '1.ts'])
        .onCompilationStarted,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the onEmit', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onEmitCommand).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onEmit', 'COMMAND_TO_RUN', '1.ts'])
        .onEmitCommand,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the onEmitDebounceMs', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onEmitDebounceMs).toBe(300);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onEmitDebounceMs', '200', '1.ts'])
        .onEmitDebounceMs,
    ).toBe(200);
  });

  it('Should return the onCompilationComplete', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onCompilationComplete).toBe(null);
    expect(
      extractArgs(['node', 'tsc-watch.js', '--onCompilationComplete', 'COMMAND_TO_RUN', '1.ts'])
        .onCompilationComplete,
    ).toBe('COMMAND_TO_RUN');
  });

  it('Should return the maxNodeMem', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).maxNodeMem).toBe(null);
    expect(extractArgs(['node', 'tsc-watch.js', '--maxNodeMem', '1024']).maxNodeMem).toBe('1024');
  });

  it('Should return the noColors', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).noColors).toBe(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--noColors', '1.ts']).noColors).toBe(true);
  });

  it('Should return the noClear', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).noClear).toBe(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--noClear', '1.ts']).noClear).toBe(true);
  });

  it('Should return the silent', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).silent).toBe(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--silent', '1.ts']).silent).toBe(true);
  });

  it('Should return the signalEmittedFiles', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).signalEmittedFiles).toBe(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--signalEmittedFiles', '1.ts']).signalEmittedFiles).toBe(true);
    expect(extractArgs(['node', 'tsc-watch.js', '--signalEmittedFiles', '1.ts']).args.includes('--listEmittedFiles')).toBe(true);
  });

  it('Should return requestedToListEmittedFiles when tsc native listEmittedFiles is set', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).requestedToListEmittedFiles).toBe(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--listEmittedFiles', '1.ts']).requestedToListEmittedFiles).toBe(true);
    expect(extractArgs(['node', 'tsc-watch.js', '--listEmittedFiles', '1.ts']).args.includes('--listEmittedFiles')).toBe(true);
  });

  it('Should return the compiler', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).compiler).toBe('typescript/bin/tsc');
    expect(
      extractArgs(['node', 'tsc-watch.js', '--compiler', 'typescript/lib/tsc', '1.ts']).compiler,
    ).toBe(require.resolve('typescript/lib/tsc'));
  });
});
