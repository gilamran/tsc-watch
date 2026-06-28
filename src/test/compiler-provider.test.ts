import path from 'path';
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

  it('Should resolve compiler when subpath is not exported (TypeScript 7+)', () => {
    const resolver: any = jest.fn().mockImplementation((id: string, options?: { paths?: string[] }) => {
      if (id === 'typescript/bin/tsc') {
        const err: NodeJS.ErrnoException = new Error('not exported');
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
        throw err;
      }
      if (id === 'typescript/package.json') {
        return options?.paths
          ? '/local/typescript/package.json'
          : '/global/typescript/package.json';
      }
      throw new Error(`unexpected resolve: ${id}`);
    });

    const compilerPath = getCompilerPath(null, resolver);
    expect(compilerPath).toBe(path.join('/local/typescript', 'bin', 'tsc'));
    expect(resolver).toHaveBeenCalledWith('typescript/package.json', { paths: [process.cwd()] });
  });

  it('Should resolve global compiler when subpath is not exported and local package is missing', () => {
    const resolver: any = jest.fn().mockImplementation((id: string, options?: { paths?: string[] }) => {
      if (id === 'typescript/bin/tsc') {
        const err: NodeJS.ErrnoException = new Error('not exported');
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
        throw err;
      }
      if (id === 'typescript/package.json' && options?.paths) {
        const err: NodeJS.ErrnoException = new Error('not found');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      if (id === 'typescript/package.json') {
        return '/global/typescript/package.json';
      }
      throw new Error(`unexpected resolve: ${id}`);
    });

    const compilerPath = getCompilerPath(null, resolver);
    expect(compilerPath).toBe(path.join('/global/typescript', 'bin', 'tsc'));
  });
});
