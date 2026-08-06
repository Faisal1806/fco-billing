const LABOUR_RATE = 3.5;

function calculateLabour(totalQty) {
  const safeQty = Number(totalQty) || 0;
  return Number((safeQty * LABOUR_RATE).toFixed(2));
}

module.exports = {
  LABOUR_RATE,
  calculateLabour,
};
