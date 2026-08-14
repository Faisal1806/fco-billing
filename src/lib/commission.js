const COMMISSION_RATE = 0.06;
const SECURITY_CHARGES_RATE = 0.06;
const COMBINED_COMMISSION_AND_SECURITY_RATE = COMMISSION_RATE + SECURITY_CHARGES_RATE;
const DEFAULT_POSTAGE = 8;
const DEFAULT_OTHER_EXPENSES = 0;

function roundAmount(value) {
  return Math.round(Number(value) || 0);
}

function calculateCommissionDeductions(grossSale) {
  const grossSaleValue = Number(grossSale) || 0;
  const commissionAmount = roundAmount(grossSaleValue * COMMISSION_RATE);
  const securityCharges = roundAmount(grossSaleValue * SECURITY_CHARGES_RATE);
  const totalCommissionRelatedExpenses = roundAmount(commissionAmount + securityCharges);

  return {
    commissionAmount,
    securityCharges,
    totalCommissionRelatedExpenses,
    combinedRate: COMBINED_COMMISSION_AND_SECURITY_RATE,
  };
}

function calculateInvoiceTotals({
  grossSale = 0,
  totalQty = 0,
  freight = 0,
  postage = DEFAULT_POSTAGE,
  otherExpenses = DEFAULT_OTHER_EXPENSES,
} = {}) {
  const grossSaleValue = roundAmount(grossSale);
  const safeQty = Number(totalQty) || 0;
  const labour = roundAmount(safeQty * 3);
  const association = roundAmount(safeQty * 0.1);
  const security = roundAmount(safeQty * 0.9);
  const { commissionAmount, securityCharges } = calculateCommissionDeductions(grossSaleValue);
  const freightValue = roundAmount(freight);
  const postageValue = roundAmount(Number(postage) || DEFAULT_POSTAGE);
  const otherExpensesValue = roundAmount(otherExpenses);
  const totalExpenses = roundAmount(
    freightValue + labour + association + security + commissionAmount + securityCharges + postageValue + otherExpensesValue
  );
  const netSale = roundAmount(grossSaleValue - totalExpenses);

  return {
    grossSale: grossSaleValue,
    labour,
    association,
    security,
    commissionAmount,
    securityCharges,
    freight: freightValue,
    postage: postageValue,
    otherExpenses: otherExpensesValue,
    totalExpenses,
    netSale,
  };
}

function normalizeInvoiceData(billData = {}) {
  const entries = Array.isArray(billData.entries) ? billData.entries : [];
  const totalQty = entries.reduce((sum, entry) => sum + (Number(entry.qty) || 0), 0);
  const pattiQty = entries.filter((entry) => entry.type === 'Patti').reduce((sum, entry) => sum + (Number(entry.qty) || 0), 0);
  const dabbaQty = entries.filter((entry) => entry.type === 'Dabba').reduce((sum, entry) => sum + (Number(entry.qty) || 0), 0);
  const grossSale = roundAmount(
    entries.reduce((sum, entry) => {
      if (entry.isForwarded) return sum;
      const entryAmount = Number(entry.total) || (Number(entry.qty) || 0) * (Number(entry.rate) || 0);
      return sum + entryAmount;
    }, 0)
  );
  const freight = roundAmount(billData.freight || billData.totals?.freight || 0);
  const postage = roundAmount(billData.totals?.postage ?? 8);
  const otherExpenses = roundAmount(billData.totals?.otherExpenses ?? 0);
  const calculated = calculateInvoiceTotals({
    grossSale: billData.totals?.grossSale ?? grossSale,
    totalQty,
    freight,
    postage,
    otherExpenses,
  });

  return {
    ...billData,
    freight,
    totals: {
      ...(billData.totals || {}),
      pattiQty,
      dabbaQty,
      totalQty,
      subtotal: roundAmount(billData.totals?.subtotal ?? calculated.grossSale),
      grossSale: calculated.grossSale,
      labour: calculated.labour,
      association: calculated.association,
      security: calculated.security,
      commissionAmount: calculated.commissionAmount,
      securityCharges: calculated.securityCharges,
      postage: calculated.postage,
      serviceCharges: calculated.securityCharges,
      otherExpenses: calculated.otherExpenses,
      totalExpenses: calculated.totalExpenses,
      netSale: calculated.netSale,
    },
  };
}

module.exports = {
  calculateCommissionDeductions,
  calculateInvoiceTotals,
  normalizeInvoiceData,
};
