const { expect } = require('chai');
const { extractArgs, isCommandExist, hasWatchCommand } = require('../lib/args-manager');

describe('Args Manager', () => {
  it('Should remove the runner args', () => {
    const { args } = extractArgs(['node', 'tsc-watch.js', '-d', '1.ts']);
    expect(args).to.deep.eq(['--watch', '-d', '1.ts']);
  });

  it('Should remove custom args', () => {
    const { args } = extractArgs(['node', 'tsc-watch.js', '--compiler', 'MY_COMPILER', '--nocolors', '--noclear', '--onsuccess', 'MY_SUCCESS', '--onfailure', 'MY_FAILURE', '--onfirstsuccess', 'MY_FIRST', '-d', '1.ts']);
    expect(args).to.deep.eq(['--watch', '-d', '1.ts']);
  });

  it('Should force watch', () => {
    const { args } = extractArgs(['node', 'tsc-watch.js', '1.ts']);
    expect(args.indexOf('--watch')).to.be.greaterThan(-1);
  });

  it('Should not re-add watch', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '-w', '1.ts']).args.indexOf('-w')).to.be.greaterThan(-1);
    expect(extractArgs(['node', 'tsc-watch.js', '--watch', '1.ts']).args.indexOf('--watch')).to.be.greaterThan(-1);
    expect(extractArgs(['node', 'tsc-watch.js', '--watch', '1.ts']).args.indexOf('--watch')).to.be.greaterThan(-1);
  });

  it('Should return the onFirstSuccessCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onFirstSuccessCommand).to.eq(null);
    expect(extractArgs(['node', 'tsc-watch.js', '--onFirstSuccess', 'COMMAND_TO_RUN', '1.ts']).onFirstSuccessCommand).to.eq('COMMAND_TO_RUN');
  });

  it('Should return the onSuccessCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onSuccessCommand).to.eq(null);
    expect(extractArgs(['node', 'tsc-watch.js', '--onSuccess', 'COMMAND_TO_RUN', '1.ts']).onSuccessCommand).to.eq('COMMAND_TO_RUN');
  });

  it('Should return the onFailureCommand', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).onFailureCommand).to.eq(null);
    expect(extractArgs(['node', 'tsc-watch.js', '--onFailure', 'COMMAND_TO_RUN', '1.ts']).onFailureCommand).to.eq('COMMAND_TO_RUN');
  });

  it('Should return the noColors', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).noColors).to.eq(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--noColors', '1.ts']).noColors).to.eq(true);
  });

  it('Should return the noClear', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).noClear).to.eq(false);
    expect(extractArgs(['node', 'tsc-watch.js', '--noClear', '1.ts']).noClear).to.eq(true);
  });

  it('Should return the compiler', () => {
    expect(extractArgs(['node', 'tsc-watch.js', '1.ts']).compiler).to.eq('typescript/bin/tsc');
    expect(extractArgs(['node', 'tsc-watch.js', '--compiler', 'MY_COMPILER', '1.ts']).compiler).to.eq('MY_COMPILER');
  });
});
