const { expect } = require('chai');
const sinon = require('sinon');
const mochaEventually = require('mocha-eventually');
const { driver } = require('./driver');
const { tscInstaller } = require('./tsc-installer');

const eventually = fn => mochaEventually(fn, 8000, 10);

describe('TSC-Watch child process messages', () => {
  for (const tsc of tscInstaller.supportedCompilers()) {
    describe('TSC ' + tsc.version, () => {
      const testSuffix = ' (tsc ' + tsc.version + ')';

      beforeEach(() => {
        this.listener = sinon.stub();
      });
      afterEach(() => driver.reset());

      it('Should send "first_success" on first success' + testSuffix, () => {
        driver
          .subscribe('first_success', this.listener)
          .startWatch({ compiler: tsc.path });

        return eventually(() => expect(this.listener.callCount).to.be.equal(1));
      });

      it('Should send "subsequent_success" on subsequent successes' + testSuffix, () => {
        driver
          .subscribe('subsequent_success', this.listener)
          .startWatch({ compiler: tsc.path })
          .modifyAndSucceedAfter(1000)
          .modifyAndSucceedAfter(3000);

        return eventually(() => expect(this.listener.callCount).to.be.equal(2));
      });

      it('Should send "compile_errors" when tsc compile errors occur' + testSuffix, () => {
        driver
          .subscribe('compile_errors', this.listener)
          .startWatch({ failFirst: true, compiler: tsc.path })
          .modifyAndFailAfter(1500);

        return eventually(() => expect(this.listener.callCount).to.be.equal(2));
      });

      it('Should send "compile_errors" when pretty param was set' + testSuffix, () => {
        driver
          .subscribe('compile_errors', this.listener)
          .startWatch({
            failFirst: true,
            pretty: true,
            compiler: tsc.path
          });

        return eventually(() => expect(this.listener.callCount).to.be.equal(1));
      });
    });
  }
});
