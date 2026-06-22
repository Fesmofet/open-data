/** Coerce legacy Mongo / chain RC amounts (often floats) to a positive integer. */
export function normalizeRcAmount(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }
  return Math.trunc(num);
}
