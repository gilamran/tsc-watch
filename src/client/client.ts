import * as path from 'path';
import { ChildProcess, fork, ForkOptions } from 'child_process';
import { EventEmitter } from 'events';

const tscWatchLibPath = path.join(__dirname, '..', 'lib', 'tsc-watch');

export class TscWatchClient extends EventEmitter {
  private tsc: ChildProcess | undefined;

  constructor(private tscWatchPath = tscWatchLibPath) {
    super();
  }

  start(...args: string[]) {
    const options: ForkOptions = { stdio: 'inherit' };
    this.tsc = fork(this.tscWatchPath, args, options);
    this.tsc.on('message', (msg: string) => {
      this.emit(...deserializeTscMessage(msg));
    });
    this.tsc.on('exit', (code: number, signal: string) => {
      this.emit('exit', code, signal);
    });
  }

  kill() {
    if (this.tsc && this.tsc.kill) {
      this.tsc.kill();
    }
    this.removeAllListeners();
  }

  runOnCompilationStartedCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-compilation-started-command');
    }
  }

  runOnCompilationCompleteCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-compilation-complete-command');
    }
  }

  runOnFirstSuccessCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-first-success-command');
    }
  }

  runOnFailureCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-failure-command');
    }
  }

  runOnSuccessCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-success-command');
    }
  }

  runOnEmitCommand() {
    if (this.tsc) {
      this.tsc.send('run-on-emit-command');
    }
  }
}

function deserializeTscMessage(strMsg: string): [string, string?] {
  const indexOfSeparator = strMsg.indexOf(':');
  if (indexOfSeparator === -1) {
    return [strMsg];
  }

  return [strMsg.substring(0, indexOfSeparator), strMsg.substring(indexOfSeparator + 1)];
}
