[![Build Status](https://travis-ci.com/gilamran/tsc-watch.svg?branch=master)](https://travis-ci.com/gilamran/tsc-watch)

# The TypeScript compiler with `--onSuccess` argument

`tsc-watch` starts a TypeScript compiler with `--watch` parameter, there are 5 new arguments.

- `--onSuccess COMMAND` - The `COMMAND` will be executed on every successful TypeScript compilation. The process will be killed and restarted on every successful compilation.
- `--onFirstSuccess COMMAND` - The `COMMAND` will be executed only one time, on the first successful TypeScript compilation, it will not get killed on every success.
- `--onFailure COMMAND` - The `COMMAND` will be executed on failed TypeScript compilation.
- `--noColors` - `tsc-watch` colors the output with green on success, and in red on failiure. Add this argument to prevent that.
- `--noClear` - In watch mode the `tsc` compiler clears the screen before reporting, using this option will prevent that.
- `--compiler PATH` - The `PATH` will be used instead of typescript compiler. Defaults typescript/bin/tsc.

Notes:
* That all the above `COMMAND`s will be killed on process exit. (Using `SIGTERM`)
* A `COMMAND` is a single command and not multi command like `script1.sh && script2.sh`

## Install

```sh
npm install tsc-watch --save-dev
```

## Usage

### From Command-Line

```sh
## Compiles the server.ts into the dist folder and run it
tsc-watch server.ts --outDir ./dist --onSuccess "node ./dist/server.js" --onFailure "echo Beep! Compilation Failed" --compiler typescript/bin/tsc

## With tsconfig.json
tsc-watch --onSuccess "node ./dist/server.js" --onFailure "echo Beep! Compilation Failed" --compiler typescript/bin/tsc
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
const TscWatchClient = require('tsc-watch/client');
const watch = new TscWatchClient();

watch.on('first_success', () => {
  console.log('First success!');
});

watch.on('success', () => {
  // Your code goes here...
});

watch.on('compile_errors', () => {
  // Your code goes here...
});

watch.start('--project', '.');

try {
  // do something...
} catch (e) {
  watch.kill(); // Fatal error, kill the compiler instance.
}
```

Notes:

- The (`onSuccess`) `COMMAND` will not run if the compilation failed.
- Any child process (`COMMAND`) will be terminated before creating a new one.
- `tsc-watch` is using the currently installed TypeScript compiler.
- `tsc-watch` is not changing the compiler, just adds the new arguments, compilation is the same, and all other arguments are the same.
- `tsc-watch` was created to allow an easy dev process with TypeScript. Commonly used to restart a node server.
