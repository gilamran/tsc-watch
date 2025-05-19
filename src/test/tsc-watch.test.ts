import spawn from 'cross-spawn';
import { Driver } from './driver';
import {
  waitFor,
  wait,
  copyFakeProjectHasTsc,
  TMP_DIR,
  removeFixtures,
  copyFakeProjectNoTsc,
} from './test-utils';
import { join } from 'path';

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

describe('TSC-Watch requires tsc', () => {
  const mockSpawn = jest.fn();
  
  beforeAll(() => {
    jest.mock('cross-spawn', () => mockSpawn);
    mockSpawn.mockReturnValue({
      stdout: {
        on: jest.fn(),
        resume: jest.fn(),
      },
      stderr: {
        pipe: jest.fn(),
      },
      on: jest.fn(),
    } as unknown as ReturnType<typeof spawn>);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockSpawn.mockClear();
    jest.resetModules();
  });

  it('should require local tsc based on cwd', async() => {
    const cwd = process.cwd();
    try {
      copyFakeProjectHasTsc();
      process.chdir(join(TMP_DIR, 'fake-project-has-tsc'));
      require('../lib/tsc-watch');
      expect(mockSpawn.mock.calls[0][1][0]).toBe(
        join(TMP_DIR, 'fake-project-has-tsc', 'node_modules', 'typescript', 'bin', 'tsc')
      );
    } finally {
      process.chdir(cwd);
      removeFixtures();
    }
  });

  it('should fallback to global tsc if local tsc is not found', async() => {
    const cwd = process.cwd();
    try {
      copyFakeProjectNoTsc();
      process.chdir(join(TMP_DIR, 'fake-project-no-tsc'));
      require('../lib/tsc-watch');
      expect(mockSpawn.mock.calls[0][1][0]).toBe(
        join(cwd, 'node_modules', 'typescript', 'bin', 'tsc')
      );
    } finally {
      process.chdir(cwd);
      removeFixtures();
    }
  })
})
