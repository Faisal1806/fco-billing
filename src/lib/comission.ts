export function calculateCommissionDeductions(grossSale: number, commissionRate: number = 6) {
  const commissionAmount = Math.round((grossSale * commissionRate) / 100);
  const securityCharges = Math.round((grossSale * commissionRate) / 100);
  return { commissionAmount, securityCharges };
}
