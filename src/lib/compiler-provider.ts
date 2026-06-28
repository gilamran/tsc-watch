import path from 'path';

export function getCompilerPath(
  compilerArg: string | null,
  resolver: NodeRequire['resolve'] = require.resolve,
): string {
  if (!compilerArg) {
    compilerArg = 'typescript/bin/tsc';
  }

  try {
    return resolveCompilerPath(compilerArg, resolver, [process.cwd()]);
  } catch (e: any) {
    if (e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      try {
        return resolveViaPackageJson(compilerArg, resolver, [process.cwd()]);
      } catch {
        // Local compiler not found, ignore and try global compiler
      }
    }
    // Local compiler not found, ignore and try global compiler
  }

  try {
    return resolveCompilerPath(compilerArg, resolver);
  } catch (e: any) {
    if (e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return resolveViaPackageJson(compilerArg, resolver);
    }
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(e.message);
      process.exit(9);
    }
    throw e;
  }
}

function resolveCompilerPath(
  compilerArg: string,
  resolver: NodeRequire['resolve'],
  paths?: string[],
): string {
  return paths ? resolver(compilerArg, { paths }) : resolver(compilerArg);
}

function resolveViaPackageJson(
  compilerArg: string,
  resolver: NodeRequire['resolve'],
  paths?: string[],
): string {
  const match = compilerArg.match(/^(.+)\/bin\/(.+)$/);
  if (!match) {
    throw new Error(`Cannot resolve '${compilerArg}': subpath is not exported.`);
  }

  const [, pkgName, binName] = match;
  const pkgJsonPath = paths
    ? resolver(`${pkgName}/package.json`, { paths })
    : resolver(`${pkgName}/package.json`);

  return path.join(path.dirname(pkgJsonPath), 'bin', binName);
}
