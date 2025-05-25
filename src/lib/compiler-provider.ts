export function getCompilerPath(compilerArg: string | null, resolver: NodeRequire['resolve'] = require.resolve): string {
  if (!compilerArg) {
    compilerArg = 'typescript/bin/tsc';
  }

  try {
    return resolver(compilerArg, { paths: [process.cwd()] });
  } catch (e) {
    // Local compiler not found, ignore and try global compiler
  }

  try {
    return resolver(compilerArg);
  } catch (e: any) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(e.message);
      process.exit(9);
    }
    throw e;
  }
}
