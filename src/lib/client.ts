import { fork, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { join } from 'path';

export class TscWatchClient extends EventEmitter {
  private tsc: ChildProcess | undefined;

  start(...args: string[]) {
    const tscWatch = require.resolve(join(process.cwd(), 'dist', 'tsc-watch'));
    this.tsc = fork(tscWatch, args, { stdio: 'inherit' });
    this.tsc.on('message', (msg: string) => {
      this.emit(...deserializeTscMessage(msg));
    });
    this.tsc.on('exit', (code: number, signal: number) => {
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
}

function deserializeTscMessage(strMsg: string): [string, string?] {
  const indexOfSeparator = strMsg.indexOf(':');
  if (indexOfSeparator === -1) {
    return [strMsg];
  }

  return [strMsg.substring(0, indexOfSeparator), strMsg.substring(indexOfSeparator + 1)];
}
