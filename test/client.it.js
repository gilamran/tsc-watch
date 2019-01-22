const { expect } = require('chai');
const sinon = require('sinon');
const mochaEventually = require('mocha-eventually');
const eventually = fn => mochaEventually(fn, 4000, 10);
const tscWatchClient = require('../lib/client');
const { driver: tscWatchDriver } = require('./driver.js');

describe('Client Events', () => {
  before(() => {
    this.successSourcePath = './tmp/fixtures/passing.ts';
    this.failSourcePath = './tmp/fixtures/failing.ts';
  });

  beforeEach(() => (this.callback = sinon.stub()));
  afterEach(() => tscWatchClient.kill());

  describe('Events', () => {
    it('Should emit "first_success" on first success', () => {
      tscWatchClient.on('first_success', this.callback);
      tscWatchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');

      return eventually(() => expect(this.callback.calledOnce).to.be.true);
    });

    it('Should fire "subsequent_success" on subsequent successes', () => {
      tscWatchClient.on('subsequent_success', this.callback);
      tscWatchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      tscWatchDriver.modifyAndSucceedAfter(1500);

      return eventually(() => expect(this.callback.calledOnce).to.be.true);
    });

    it('Should fire "compile_errors" on when tsc compile errors occur', () => {
      tscWatchClient.on('compile_errors', this.callback);
      tscWatchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/failing.ts');

      return eventually(() => expect(this.callback.calledOnce).to.be.true);
    });
  });
});
