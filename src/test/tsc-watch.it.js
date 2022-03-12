const { expect } = require('chai');
const { stub } = require('sinon');
const { driver } = require('./driver');
const { waitFor } = require('./test-utils');

describe('TSC-Watch child process messages', () => {
  afterEach(() => driver.reset());

  it('Should send "started" on compilation start', async () => {
    const listener = stub();
    driver.subscribe('started', listener).startWatch().modifyAndSucceedAfter(1000);
    return waitFor(() => listener.callCount === 2);
  });

  it('Should send "first_success" on first success', async () => {
    const listener = stub();
    driver.subscribe('first_success', listener).startWatch().modifyAndSucceedAfter(1000);
    return waitFor(() => listener.callCount === 1);
  });

  it('Should send "success" on subsequent successes', async () => {
    const listener = stub();
    driver.subscribe('success', listener).startWatch().modifyAndSucceedAfter(1000);
    return waitFor(() => listener.callCount === 2);
  });

  it('Should send "compile_errors" when tsc compile errors occur', async () => {
    const listener = stub();
    driver
      .subscribe('compile_errors', listener)
      .startWatch({ failFirst: true })
      .modifyAndFailAfter(1500);

      return waitFor(() => listener.callCount === 2);
  });

  it('Should send "compile_errors" when pretty param was set', async () => {
    const listener = stub();
    driver.subscribe('compile_errors', listener).startWatch({ failFirst: true, pretty: true });
    return waitFor(() => listener.callCount === 1);
  });
});
