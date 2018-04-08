const { fork } = require('child_process');
const fs = require('fs');
const subscriptions = new Map();

const driver = {
  noop: () => {},
  wait: Promise.resolve(),
  successFilePath: './tmp/fixtures/passing.ts',
  failFilePath: './tmp/fixtures/failing.ts',
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
    driver._extendWait(wait).then(() => fs.appendFileSync(driver.successFilePath, ' '));
    return driver;
  },

  modifyAndFailAfter: (wait = 0) => {
    driver._extendWait(wait).then(() => fs.appendFileSync(driver.failFilePath, '{{{'));
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
