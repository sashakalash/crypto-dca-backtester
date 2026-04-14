export function applyFee(
  investmentAmount: number,
  feeRate: number
): { netAmount: number; fee: number } {
  const fee = investmentAmount * feeRate
  return { netAmount: investmentAmount - fee, fee }
}
