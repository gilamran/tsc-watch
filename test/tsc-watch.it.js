const { fork } = require('child_process');
const { expect } = require('chai');
const sinon = require('sinon');
const mochaEventually = require('mocha-eventually');
const fs = require('fs');

const eventually = fn => mochaEventually(fn, 4000, 10);
const subscriptions = new Map();

describe('TSC-Watch child process messages', () => {
    beforeEach(() => this.listener = sinon.stub());
    afterEach(() => driver.reset());

    it('Should send "first_success" on first success', () => {
      driver
        .subscribe('first_success', this.listener)
        .startWatch();

      return eventually(() =>
        expect(this.listener.callCount).to.be.equal(1));
    });

    it('Should send "subsequent_success" on subsequent successes', () => {
      driver
        .subscribe('subsequent_success', this.listener)
        .startWatch()
        .modifyAndSucceedAfter(2000)
        .modifyAndSucceedAfter(1000)

        return eventually(() =>
          expect(this.listener.callCount).to.be.equal(2));
    });

    it('Should send "compile_errors" when tsc compile errors occur', () => {
      driver
        .subscribe('compile_errors', this.listener)
        .startWatch({ failFirst: true })
        .modifyAndFailAfter(1500);

        return eventually(() =>
          expect(this.listener.callCount).to.be.equal(2));
    });
});


const driver = {
  noop: () => {},
  wait: Promise.resolve(),
  successFilePath: './tmp/fixtures/passing.ts',
  failFilePath: './tmp/fixtures/failing.ts',
  successSuffix: '   ',
  failSuffix: '{{{',
  subscribe: (processEventName, listener) => {
    subscriptions.set(processEventName, listener);
    return driver;
  },

  startWatch: ({failFirst} = {}) => {
    driver.proc = fork('./lib/tsc-watch.js', ['--out', './tmp/output.js', failFirst ? driver.failFilePath : driver.successFilePath], { stdio: 'inherit' });

    subscriptions.forEach((handler, evName) =>
      driver.proc.on('message', event => evName === event
        ? handler(event)
        : driver.noop()));

    return driver;
  },

  modifyAndSucceedAfter: (wait = 0, isFailingPath) => {
    driver._extendWait(wait).then(() => fs.appendFileSync(driver.successFilePath, driver.successSuffix));
    return driver;
  },

  modifyAndFailAfter: (wait = 0) => {
    driver._extendWait(wait).then(() => fs.appendFileSync(driver.failFilePath, driver.failSuffix));
    return driver;
  },

  reset: () => {
    if (driver.proc && driver.proc.kill) {
      driver.proc.kill();
      delete driver.proc;
    }

    subscriptions.clear();
    driver.wait = Promise.resolve();
    return driver;
  },

  _extendWait: ms => driver.wait = driver.wait.then(() => new Promise(resolve => setTimeout(resolve, ms)))
};



module.exports.driver = driver;
