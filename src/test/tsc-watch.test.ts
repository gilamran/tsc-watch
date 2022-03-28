import { Driver } from './driver';
import { waitFor, wait } from './test-utils';

describe('TSC-Watch child process messages', () => {
  let driver: Driver;

  beforeEach(() => (driver = new Driver()));
  afterEach(() => driver.dispose());

  it('Should send "started" on compilation start', async () => {
    const listener = jest.fn();
    driver.subscribe('started', listener).startWatch();
    await wait(5000);
    driver.modifyToAValidChange();
    return waitFor(() => listener.mock.calls.length === 2);
  });

  it('Should send "first_success" on first success', async () => {
    const listener = jest.fn();
    driver.subscribe('first_success', listener).startWatch();
    await wait(5000);
    driver.modifyToAValidChange();
    return waitFor(() => listener.mock.calls.length === 1);
  });

  it('Should send "success" on subsequent successes', async () => {
    const listener = jest.fn();
    driver.subscribe('success', listener).startWatch();
    await wait(5000);
    driver.modifyToAValidChange();
    return waitFor(() => listener.mock.calls.length === 2);
  });

  it('Should send "compile_errors" when tsc compile errors occur', async () => {
    const listener = jest.fn();
    driver.subscribe('compile_errors', listener).startWatch({ failFirst: true });
    await wait(5000);
    driver.modifyToAnInvalidChange();

    return waitFor(() => listener.mock.calls.length === 2);
  });

  it('Should send "compile_errors" when pretty param was set', async () => {
    const listener = jest.fn();
    driver.subscribe('compile_errors', listener).startWatch({ failFirst: true, pretty: true });
    return waitFor(() => listener.mock.calls.length === 1);
  });
});
