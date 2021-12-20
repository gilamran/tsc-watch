const { expect } = require('chai');
const sinon = require('sinon');
const TscWatchClient = require('../lib/client');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Client Events', () => {
  let watchClient;
  let callback;

  beforeEach(() => {
    watchClient = new TscWatchClient();
    callback = sinon.stub();
  });
  afterEach(() => watchClient.kill());

  describe('Events', () => {
    it('Should emit "started" on compilation start', async () => {
      watchClient.on('started', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/failing.ts');
      await wait(2000)

      expect(callback.calledOnce).to.be.true;
    });

    it('Should emit "first_success" on first success', async () => {
      watchClient.on('first_success', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      await wait(2000)

      expect(callback.calledOnce).to.be.true;
    });

    it('Should emit "success" on first success', async () => {
      watchClient.on('success', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      await wait(2000)

      expect(callback.calledOnce).to.be.true;
    });

    it('Should fire "compile_errors" on when tsc compile errors occur', async () => {
      watchClient.on('compile_errors', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/failing.ts');
      await wait(2000)

      expect(callback.calledOnce).to.be.true;
    });
  });
});
