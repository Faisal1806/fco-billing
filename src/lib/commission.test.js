const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCommissionDeductions } = require('./commission');

test('splits commission and security charges at 0.06% each', () => {
  const result = calculateCommissionDeductions(15000);

  assert.equal(result.commissionAmount, 9);
  assert.equal(result.securityCharges, 9);
  assert.equal(result.totalCommissionRelatedExpenses, 18);
});

test('returns zero for zero gross sale', () => {
  const result = calculateCommissionDeductions(0);

  assert.equal(result.commissionAmount, 0);
  assert.equal(result.securityCharges, 0);
  assert.equal(result.totalCommissionRelatedExpenses, 0);
});
