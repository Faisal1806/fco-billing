const assert = require('assert');
const { calculateLabour } = require('./labour');

assert.equal(calculateLabour(100), 350);
assert.equal(calculateLabour(0), 0);
assert.equal(calculateLabour(10.5), 36.75);

console.log('labour tests passed');
