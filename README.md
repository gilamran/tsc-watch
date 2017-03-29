# The TypeScript compiler with onSuccess command
`tscw` starts the `tsc` (TypeScript compiler) with `--watch` parameter, it also adds a new argument `--onSuccess COMMAND`. this `COMMAND` will be executed on every successful TypeScript compilation.

Notes:
* The `COMMAND` will not run if the compilation failed.
* `tscw` is using the currently installed TypeScript compiler.
* `tscw` is not changing the compiler, just adds the new arguments, compilation is the same, and all other arguments are the same.
* `tscw` was created to allow an easy dev process with TypeScript. Mostly to restart a node server.