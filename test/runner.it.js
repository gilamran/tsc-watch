const { expect } = require('chai');
const runner = require('../lib/runner');

describe.only('Runner', () => {
  it('Should start a long running process and kill it before it finishes', (done) => {
    const kill = runner('sleep 10')
    setTimeout(function() {
      kill().then(function(result) {
        expect(result).to.deep.equal([0,null])
        done()
      })
    }, 1)
  })
  it('Should start a short running process and not kill it before it finishes', (done) => {
    const kill = runner('echo')
    setTimeout(function() {
      kill().then(function(result) {
        expect(result).to.deep.equal([1,0])
        done()
      })
    }, 5)
  })
})
