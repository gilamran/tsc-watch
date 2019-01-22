const { fork } = require('child_process');
const EventEmitter = require('events');

class TscEventsClient extends EventEmitter {
  start(...args) {
    this.tsc = fork(require.resolve('./tsc-watch.js'), args, { stdio: 'inherit' });
    this.tsc.on('message', msg => this.emit(msg));
  }

  kill() {
    if (this.tsc && this.tsc.kill) {
      this.tsc.kill();
    }
    this.removeAllListeners();
  }
}

const client = new TscEventsClient();

module.exports = client;
