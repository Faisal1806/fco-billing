export function normalizeInvoiceData<T extends Record<string, any>>(
  billData: T
): T & {
  freight: number;
  totals: T extends { totals?: infer U } ? U & {
    pattiQty: number;
    dabbaQty: number;
    totalQty: number;
    subtotal: number;
    grossSale: number;
    labour: number;
    association: number;
    security: number;
    commissionAmount: number;
    securityCharges: number;
    postage: number;
    serviceCharges: number;
    otherExpenses: number;
    totalExpenses: number;
    netSale: number;
  } : {
    pattiQty: number;
    dabbaQty: number;
    totalQty: number;
    subtotal: number;
    grossSale: number;
    labour: number;
    association: number;
    security: number;
    commissionAmount: number;
    securityCharges: number;
    postage: number;
    serviceCharges: number;
    otherExpenses: number;
    totalExpenses: number;
    netSale: number;
  };
};

export function calculateCommissionDeductions(
  grossSale: number
): {
  commissionAmount: number;
  securityCharges: number;
  totalCommissionRelatedExpenses: number;
  combinedRate: number;
};

export function calculateInvoiceTotals(options?: {
  grossSale?: number;
  totalQty?: number;
  freight?: number;
  postage?: number;
  otherExpenses?: number;
}): {
  grossSale: number;
  labour: number;
  association: number;
  security: number;
  commissionAmount: number;
  securityCharges: number;
  serviceCharges: number;
  freight: number;
  postage: number;
  otherExpenses: number;
  totalExpenses: number;
  netSale: number;
};