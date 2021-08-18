const { fork } = require('child_process');
const EventEmitter = require('events');

class TscWatchClient extends EventEmitter {
  start(...args) {
    this.tsc = fork(require.resolve('./tsc-watch.js'), args, { stdio: 'inherit' });
    this.tsc.on('message', (msg) => this.emit(msg));
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

module.exports = TscWatchClient;
