const { expect } = require('chai');
const sinon = require('sinon');
const { driver } = require('./driver');

describe('TSC-Watch child process messages', () => {
  afterEach(() => driver.reset());

  it('Should send "started" on compilation start', async () => {
    const listener = sinon.stub();
    driver.subscribe('started', listener).startWatch().modifyAndSucceedAfter(1000);
    await driver.wait(4000);

    expect(listener.callCount).to.be.equal(2);
  });

  it('Should send "first_success" on first success', async () => {
    const listener = sinon.stub();
    driver.subscribe('first_success', listener).startWatch().modifyAndSucceedAfter(1000);
    await driver.wait(3000);
    expect(listener.callCount).to.be.equal(1);
  });

  it('Should send "success" on subsequent successes', async () => {
    const listener = sinon.stub();
    driver.subscribe('success', listener).startWatch().modifyAndSucceedAfter(1000);
    await driver.wait(3000);
    expect(listener.callCount).to.be.equal(2);
  });

  it('Should send "compile_errors" when tsc compile errors occur', async () => {
    const listener = sinon.stub();
    driver
      .subscribe('compile_errors', listener)
      .startWatch({ failFirst: true })
      .modifyAndFailAfter(1500);

      await driver.wait(3000);
      expect(listener.callCount).to.be.equal(2);
  });

  it('Should send "compile_errors" when pretty param was set', async () => {
    const listener = sinon.stub();
    driver.subscribe('compile_errors', listener).startWatch({ failFirst: true, pretty: true });
    await driver.wait(3000);
    expect(listener.callCount).to.be.equal(1);
  });

  it('Should not start extra onSuccess commands when previous ones are slow to die (gilamran/tsc-watch#87)', async () => {
    const findProcess = require('find-process');

    driver.startWatch({ command: 'unkillable-command' });
    await driver.wait(3000);

    const [ unkillable ] = await findProcess('name', 'unkillable-command.js', true);

    // Trigger a new onSuccess command, but don't allow the first one to die just yet.
    driver.modifyAndSucceedAfter(0);
    await driver.wait(3000);

    // Try to trigger *another* new onSuccess command while still waiting for the first one to die.
    driver.modifyAndSucceedAfter(0);
    await driver.wait(3000);

    // Finally let the old first onSuccess command die.
    process.kill(unkillable.pid, 'SIGKILL');
    await driver.wait(100);

    // There should only be one onSuccess command running (the one triggered by the final successful compile).
    expect(await findProcess('name', 'unkillable-command.js', true)).to.have.length(1);
  });
});
