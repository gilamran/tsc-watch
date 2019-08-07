const { expect } = require('chai');
const sinon = require('sinon');
const mochaEventually = require('mocha-eventually');
const eventually = fn => mochaEventually(fn, 8000, 50);
const TscWatchClient = require('../lib/client');
const { driver: tscWatchDriver } = require('./driver.js');
const { tscInstaller } = require('./tsc-installer');

describe('Client Events', () => {
  for (const tsc of tscInstaller.supportedCompilers()) {
    describe('TSC ' + tsc.version, () => {
      const testSuffix = ' (tsc ' + tsc.version + ')';
      let watchClient;
      let callback;

      beforeEach(() => {
        watchClient = new TscWatchClient();
        callback = sinon.stub();
      });
      afterEach(() => watchClient.kill());

      describe('Events' + testSuffix, () => {
        it('Should emit "first_success" on first success' + testSuffix, () => {
          watchClient.on('first_success', callback);
          watchClient.start(
            '--noClear',
            '--compiler',
            tsc.path,
            '--out',
            './tmp/output.js',
            './tmp/fixtures/passing.ts'
          );

          return eventually(() => expect(callback.calledOnce).to.be.true);
        });

        it('Should fire "subsequent_success" on subsequent successes' + testSuffix, () => {
          watchClient.on('subsequent_success', callback);
          watchClient.start(
            '--noClear',
            '--compiler',
            tsc.path,
            '--out',
            './tmp/output.js',
            './tmp/fixtures/passing.ts'
          );
          tscWatchDriver.modifyAndSucceedAfter(1500);

          return eventually(() => expect(callback.calledOnce).to.be.true);
        });

        it('Should fire "compile_errors" on when tsc compile errors occur' + testSuffix, () => {
          watchClient.on('compile_errors', callback);
          watchClient.start(
            '--noClear',
            '--compiler',
            tsc.path,
            '--out',
            './tmp/output.js',
            './tmp/fixtures/failing.ts'
          );

          return eventually(() => expect(callback.calledOnce).to.be.true);
        });
      });
    });
  }
});
