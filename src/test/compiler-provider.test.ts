import { getCompilerPath } from '../lib/compiler-provider';

describe('Compiler Provider', () => {

  it('Should return the custom compiler', () => {
    const resolver: any = jest.fn().mockImplementation((id: string) => 'TYPESCRIPT_COMPILER_PATH');
    
    const compilerPath = getCompilerPath('path/to/custom-compiler', resolver);
    expect(compilerPath).toBe('TYPESCRIPT_COMPILER_PATH');
    expect(resolver).toHaveBeenCalledWith('path/to/custom-compiler', { paths: [process.cwd()] });
  });

  it('Should return the local compiler', () => {
    const resolver: any = jest.fn().mockImplementation((id: string) => 'LOCAL_TYPESCRIPT_COMPILER_PATH');

    
    const compilerPath = getCompilerPath(null, resolver);
    expect(compilerPath).toBe('LOCAL_TYPESCRIPT_COMPILER_PATH');
    expect(resolver).toHaveBeenCalledWith('typescript/bin/tsc', { paths: [process.cwd()] });
  });

  it('Should return the global compiler, if local compiler is not found', () => {
    let callIndex = 0;
    const resolver: any = jest.fn().mockImplementation((id: string) => {
      if (callIndex === 0) {
        callIndex++;
        throw new Error('MODULE_NOT_FOUND');
      }

      return 'GLOBAL_TYPESCRIPT_COMPILER_PATH';
    });

    
    const compilerPath = getCompilerPath(null, resolver);
    expect(compilerPath).toBe('GLOBAL_TYPESCRIPT_COMPILER_PATH');
  });
});
