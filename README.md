# The TypeScript compiler with `--watch` and a new onSuccess argument
`tsc-watch` starts the `tsc` (TypeScript compiler) with `--watch` parameter, it also adds a new argument `--onSuccess COMMAND`. this `COMMAND` will be executed on every successful TypeScript compilation.

## Install

```sh
npm install tsc-watch --save-dev
```

## Usage

### From Command-Line

```sh
tsc-watch server.ts --outDir ./dist --onSuccess "node ./dist/server.ts"
```

### From Code

The client is implemented as an instance of `Node.JS`'s `EventEmitter`, with the following events:

- `first_success` - Emitted upon first successful compilation.
- `subsequent_success` - Emitted upon every subsequent successful compilation.
- `compile_errors` - Emitted upon every failing compilation.

Once subscribed to the relevant events, start the client by running `watch.start()`

To kill the client, run `watch.kill()`

Example usage:

```javascript
const watch = require('tsc-watch/client');

watch.on('first_success', () => {
  console.log('First success!');
});

watch.on('subsequent_success', () => {
  // Your code goes here...
});

watch.on('compile_errors', () => {
  // Your code goes here...
});

watch.start();

try {
  // do something...
} catch (e) {
  watch.kill(); // Fatal error, kill the compiler instance.
}
```

Notes:
* The `COMMAND` will not run if the compilation failed.
* The child process (`COMMAND`) will be terminated before creating a new one.
* `tsc-watch` is using the currently installed TypeScript compiler.
* `tsc-watch` is not changing the compiler, just adds the new arguments, compilation is the same, and all other arguments are the same.
* `tsc-watch` was created to allow an easy dev process with TypeScript. Commonly used to restart a node server.
