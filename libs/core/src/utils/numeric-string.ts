const PLAIN_NUMERIC = /^-?\d+(\.\d+)?$/;
const ZERO = BigInt(0);

function pow10(exp: number): bigint {
  if (exp <= 0) {
    return BigInt(1);
  }
  return BigInt(`1${'0'.repeat(exp)}`);
}

function countDecimals(value: string): number {
  const normalized = value.startsWith('-') ? value.slice(1) : value;
  const dot = normalized.indexOf('.');
  return dot === -1 ? 0 : normalized.length - dot - 1;
}

function toScaledBigInt(value: string, decimals: number): bigint {
  const negative = value.startsWith('-');
  const normalized = negative ? value.slice(1) : value;
  const [whole = '0', fraction = ''] = normalized.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, '') || '0';
  const bi = BigInt(combined);
  return negative ? -bi : bi;
}

function formatScaledBigInt(
  value: bigint,
  decimals: number,
  maxDecimals: number,
): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const str = abs.toString().padStart(decimals + 1, '0');
  const wholeLen = Math.max(str.length - decimals, 1);
  const whole = decimals > 0 ? str.slice(0, wholeLen) : str;
  let fraction = decimals > 0 ? str.slice(wholeLen) : '';
  if (maxDecimals < fraction.length) {
    fraction = fraction.slice(0, maxDecimals);
  }
  fraction = fraction.replace(/0+$/, '');
  if (!fraction) {
    return `${negative ? '-' : ''}${whole}`;
  }
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

/** Hive Engine WAIV token precision (legacy TOKEN_WAIV.FRACTION_PRECISION). */
export const WAIV_FRACTION_PRECISION = 8;

export function multiplyNumericStrings(
  a: string,
  b: string,
  maxDecimals: number,
): string | null {
  const rawA = a.trim();
  const rawB = b.trim();
  if (!PLAIN_NUMERIC.test(rawA) || !PLAIN_NUMERIC.test(rawB)) {
    return null;
  }
  const decA = countDecimals(rawA);
  const decB = countDecimals(rawB);
  const product = toScaledBigInt(rawA, decA) * toScaledBigInt(rawB, decB);
  return formatScaledBigInt(product, decA + decB, maxDecimals);
}

export function divideNumericStrings(
  a: string,
  b: string,
  maxDecimals: number,
): string | null {
  const rawA = a.trim();
  const rawB = b.trim();
  if (!PLAIN_NUMERIC.test(rawA) || !PLAIN_NUMERIC.test(rawB)) {
    return null;
  }
  const decA = countDecimals(rawA);
  const decB = countDecimals(rawB);
  const intA = toScaledBigInt(rawA, decA);
  const intB = toScaledBigInt(rawB, decB);
  if (intB === ZERO) {
    return null;
  }
  const scale = pow10(maxDecimals);
  const numerator = intA * scale * pow10(decB);
  const denominator = intB * pow10(decA);
  const quotient = numerator / denominator;
  return formatScaledBigInt(quotient, maxDecimals, maxDecimals);
}
