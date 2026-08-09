const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCommissionDeductions, calculateInvoiceTotals } = require('./commission');

test('splits commission and security charges at 6% each', () => {
  const result = calculateCommissionDeductions(15000);

  assert.equal(result.commissionAmount, 900);
  assert.equal(result.securityCharges, 900);
  assert.equal(result.totalCommissionRelatedExpenses, 1800);
});

test('returns zero for zero gross sale', () => {
  const result = calculateCommissionDeductions(0);

  assert.equal(result.commissionAmount, 0);
  assert.equal(result.securityCharges, 0);
  assert.equal(result.totalCommissionRelatedExpenses, 0);
});

test('calculates invoice totals using the shared expense formula', () => {
  const result = calculateInvoiceTotals({
    grossSale: 15000,
    totalQty: 16,
    freight: 160,
    postage: 8,
    otherExpenses: 0,
  });

  assert.equal(result.labour, 56);
  assert.equal(result.association, 1.6);
  assert.equal(result.security, 14.4);
  assert.equal(result.commissionAmount, 900);
  assert.equal(result.securityCharges, 900);
  assert.equal(result.totalExpenses, 2040);
  assert.equal(result.netSale, 12960);
});

test('applies commission and security charges at a combined 12% total rate', () => {
  const result = calculateCommissionDeductions(10000);

  assert.equal(result.commissionAmount, 600);
  assert.equal(result.securityCharges, 600);
  assert.equal(result.totalCommissionRelatedExpenses, 1200);
});

test('uses default postage and other expenses when missing', () => {
  const result = calculateInvoiceTotals({ grossSale: 1000, totalQty: 0, freight: 0 });

  assert.equal(result.postage, 8);
  assert.equal(result.otherExpenses, 0);
  assert.equal(result.totalExpenses, 128);
  assert.equal(result.netSale, 872);
});
