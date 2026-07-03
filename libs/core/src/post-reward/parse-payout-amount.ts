export function parsePayoutAmount(amount: string | null | undefined): number {
  if (amount == null || amount === '') {
    return 0;
  }
  const n = parseFloat(String(amount).replace(/\s[A-Z.]*$/i, ''));
  return Number.isFinite(n) ? n : 0;
}
