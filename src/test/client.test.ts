import { join } from 'path';
import { TscWatchClient } from '../client';
import {
  copyFixtures,
  FAILING_FILE,
  OUTPUT_FILE,
  PASSING_FILE,
  removeFixtures,
  waitFor,
} from './test-utils';
import type { ChildProcess } from 'child_process';

const child_process = require('child_process');

describe('Client Events', () => {
  let watchClient: TscWatchClient;
  let callback: jest.Mock;

  beforeEach(() => {
    const tscWatchPath = require.resolve(join('..', '..', 'dist', 'lib', 'tsc-watch'));
    watchClient = new TscWatchClient(tscWatchPath);
    callback = jest.fn();
    copyFixtures();
  });

  afterEach(() => {
    watchClient.kill();
    removeFixtures();
  });

  describe('Events', () => {
    it('Should emit "started" on compilation start', () => {
      watchClient.on('started', callback);
      watchClient.start('--noClear', '--out', OUTPUT_FILE, FAILING_FILE);
      return waitFor(() => callback.mock.calls.length > 0);
    });

    it('Should emit "first_success" on first success', async () => {
      watchClient.on('first_success', callback);
      watchClient.start('--noClear', '--out', OUTPUT_FILE, PASSING_FILE);
      return waitFor(() => callback.mock.calls.length > 0);
    });

    it('Should emit "success" on first success', async () => {
      watchClient.on('success', callback);
      watchClient.start('--noClear', '--out', OUTPUT_FILE, PASSING_FILE);
      return waitFor(() => callback.mock.calls.length > 0);
    });

    it('Should deserialize and emit a "file_emitted" with the emitted file path', async function () {
      watchClient.on('file_emitted', callback);
      watchClient.start('--noClear', '--listEmittedFiles', '--out', OUTPUT_FILE, PASSING_FILE);
      return waitFor(() => {
        if (callback.mock.calls.length > 0) {
          const firstCall = callback.mock.calls[0];
          const callFirstArg = firstCall[0];
          return callFirstArg === OUTPUT_FILE;
        }
      });
    });

    it('Should fire "compile_errors" on when tsc compile errors occur', async () => {
      watchClient.on('compile_errors', callback);
      watchClient.start('--noClear', '--out', OUTPUT_FILE, FAILING_FILE);
      return waitFor(() => callback.mock.calls.length > 0);
    });

    it('Should fire back "exit" event when the process is exited by a signal', async function () {
      const forkSpy = jest.spyOn(child_process, 'fork');
      watchClient.on('exit', callback);
      watchClient.start('--noClear', '--out', OUTPUT_FILE, PASSING_FILE);
      const tscProcess: ChildProcess = forkSpy.mock.results[0].value;

      // Wait tsc-watch to be started and bound before to kill process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      process.kill(tscProcess.pid, 6);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await waitFor(() => callback.mock.calls.length > 0);
      expect(callback.mock.calls[0]).toEqual([null, 'SIGABRT']);
    });
  });
});
