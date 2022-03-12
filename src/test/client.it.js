const child_process = require('child_process');
const { expect } = require('chai');
const { stub, createSandbox } = require('sinon');
const { TscWatchClient } = require('../../dist/client');
const { waitFor } = require('./test-utils');

describe('Client Events', () => {
  let watchClient;
  let callback;
  let sandbox;

  beforeEach(() => {
    watchClient = new TscWatchClient();
    callback = stub();
    sandbox = createSandbox();
  });
  afterEach(() => {
    watchClient.kill();
    sandbox.restore();
  });

  describe('Events', () => {
    it('Should emit "started" on compilation start', () => {
      watchClient.on('started', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/failing.ts');
      return waitFor(() => callback.calledOnce);
    });

    it('Should emit "first_success" on first success', async () => {
      watchClient.on('first_success', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      return waitFor(() => callback.calledOnce);
    });

    it('Should emit "success" on first success', async () => {
      watchClient.on('success', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      return waitFor(() => callback.calledOnce);
    });

    it('Should deserialize and emit a "file_emitted" with the emitted file path', async function () {
      const forkSpy = sandbox.spy(child_process, 'fork');
      watchClient.on('file_emitted', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/passing.ts');
      const [tscProcess] = forkSpy.returnValues;
      tscProcess.emit('message', 'file_emitted:/dist/tmp/fixtures/passing.js');

      expect(callback.args).to.deep.equal([['/dist/tmp/fixtures/passing.js']]);
    });

    it('Should fire "compile_errors" on when tsc compile errors occur', async () => {
      watchClient.on('compile_errors', callback);
      watchClient.start('--noClear', '--out', './tmp/output.js', './tmp/fixtures/failing.ts');
      return waitFor(() => callback.calledOnce);
    });
  });
});
