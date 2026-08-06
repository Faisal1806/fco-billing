const COMMISSION_RATE = 0.0006;

function calculateCommissionDeductions(grossSale) {
  const grossSaleValue = Number(grossSale) || 0;
  const commissionAmount = Number((grossSaleValue * COMMISSION_RATE).toFixed(2));
  const securityCharges = Number((grossSaleValue * COMMISSION_RATE).toFixed(2));

  return {
    commissionAmount,
    securityCharges,
    totalCommissionRelatedExpenses: Number((commissionAmount + securityCharges).toFixed(2)),
  };
}

module.exports = {
  calculateCommissionDeductions,
};
