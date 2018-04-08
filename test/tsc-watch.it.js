const { expect } = require('chai');
const sinon = require('sinon');
const mochaEventually = require('mocha-eventually');
const { driver } = require('./driver');

const eventually = fn => mochaEventually(fn, 4000, 10);

describe('TSC-Watch child process messages', () => {
    beforeEach(() => this.listener = sinon.stub());
    afterEach(() => driver.reset());

    it('Should send "first_success" on first success', () => {
      driver
        .subscribe('first_success', this.listener)
        .startWatch();

      return eventually(() =>
        expect(this.listener.callCount).to.be.equal(1));
    });

    it('Should send "subsequent_success" on subsequent successes', () => {
      driver
        .subscribe('subsequent_success', this.listener)
        .startWatch()
        .modifyAndSucceedAfter(2000)
        .modifyAndSucceedAfter(1000)

        return eventually(() =>
          expect(this.listener.callCount).to.be.equal(2));
    });

    it('Should send "compile_errors" when tsc compile errors occur', () => {
      driver
        .subscribe('compile_errors', this.listener)
        .startWatch({ failFirst: true })
        .modifyAndFailAfter(1500);

        return eventually(() =>
          expect(this.listener.callCount).to.be.equal(2));
    });
});
