/** OBL ledger amounts are stored as NUMERIC(20,8). */
export const OBL_USD_MAX_DECIMALS = 8;

export type OblUsdAmountKind = 'positive' | 'nonnegative';

/** Decimal string without junk suffixes (rejects `1dfdf.5`, `1.`, `.5`, `01`). */
const STRICT_USD_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function countDecimals(value: string): number {
  const dot = value.indexOf('.');
  return dot === -1 ? 0 : value.length - dot - 1;
}

function scaledValue(value: string): bigint {
  const [whole = '0', fraction = ''] = value.split('.');
  const padded = fraction.padEnd(OBL_USD_MAX_DECIMALS, '0').slice(0, OBL_USD_MAX_DECIMALS);
  const combined = `${whole}${padded}`.replace(/^0+(?=\d)/, '') || '0';
  return BigInt(combined);
}

function normalizeFromNumber(value: number, kind: OblUsdAmountKind): string | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  if (kind === 'positive' && value <= 0) {
    return null;
  }
  if (kind === 'nonnegative' && value < 0) {
    return null;
  }
  return value.toFixed(OBL_USD_MAX_DECIMALS);
}

/**
 * Parse and normalize an OBL USD amount to 8 decimal places.
 * Returns null when the value is not a strict decimal string/number.
 */
export function parseOblUsdAmount(
  value: number | string,
  kind: OblUsdAmountKind = 'positive',
): string | null {
  if (typeof value === 'number') {
    return normalizeFromNumber(value, kind);
  }

  const raw = value.trim();
  if (!STRICT_USD_DECIMAL.test(raw)) {
    return null;
  }
  if (countDecimals(raw) > OBL_USD_MAX_DECIMALS) {
    return null;
  }

  const scaled = scaledValue(raw);
  const zero = BigInt(0);
  if (kind === 'positive' && scaled <= zero) {
    return null;
  }
  if (kind === 'nonnegative' && scaled < zero) {
    return null;
  }

  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) {
    return null;
  }
  return asNumber.toFixed(OBL_USD_MAX_DECIMALS);
}

export function isOblUsdAmount(
  value: number | string,
  kind: OblUsdAmountKind = 'positive',
): boolean {
  return parseOblUsdAmount(value, kind) !== null;
}
