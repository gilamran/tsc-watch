const { expect } = require('chai');
const tscWatchClient = require('../client');

describe('Client', () => {
  it('Should be consumable as a module', () => {
    expect(tscWatchClient).to.exist;
  });
});
