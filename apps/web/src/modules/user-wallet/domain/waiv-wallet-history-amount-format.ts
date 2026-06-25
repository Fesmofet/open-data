import {
  divideNumericStrings,
  WAIV_FRACTION_PRECISION,
} from '@opden-data-layer/core/utils/numeric-string';

export { divideNumericStrings, WAIV_FRACTION_PRECISION };

const WALLET_HISTORY_LARGE_QUANTITY_DECIMALS = 3;
/** Hive Engine WAIV token precision (legacy TOKEN_WAIV.FRACTION_PRECISION). */
const WALLET_HISTORY_SMALL_QUANTITY_DECIMALS = 8;
const PLAIN_NUMERIC = /^-?\d+(\.\d+)?$/;

function truncateToDecimalPlaces(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.trunc(value * factor) / factor;
}

function truncateNumericString(raw: string, places: number): string {
  if (!PLAIN_NUMERIC.test(raw)) {
    return raw;
  }
  const negative = raw.startsWith('-');
  const normalized = negative ? raw.slice(1) : raw;
  if (!normalized.includes('.')) {
    return raw;
  }
  const [whole, fraction = ''] = normalized.split('.');
  const truncatedFraction = fraction.slice(0, places).replace(/0+$/, '');
  if (!truncatedFraction) {
    return `${negative ? '-' : ''}${whole}`;
  }
  return `${negative ? '-' : ''}${whole}.${truncatedFraction}`;
}

/**
 * Values like 0.00026163 → 0.00026: keep leading zeros, first non-zero digit,
 * and at most one following digit (omit it when that digit is 0).
 */
function formatCompactLeadingZeroFraction(fraction: string): string {
  const firstSig = fraction.search(/[1-9]/);
  if (firstSig === -1) {
    return '';
  }
  const afterFirstSig = fraction[firstSig + 1];
  const end =
    afterFirstSig === undefined || afterFirstSig === '0'
      ? firstSig + 1
      : firstSig + 2;
  return fraction.slice(0, end);
}

function formatSubUnitNumericString(raw: string): string {
  const negative = raw.startsWith('-');
  const normalized = negative ? raw.slice(1) : raw;
  if (!normalized.includes('.')) {
    return raw;
  }
  const [whole, fraction = ''] = normalized.split('.');
  const capped = fraction.slice(0, WALLET_HISTORY_SMALL_QUANTITY_DECIMALS);
  const firstSig = capped.search(/[1-9]/);
  if (firstSig === -1) {
    return `${negative ? '-' : ''}${whole}`;
  }

  // 0.5xx — same 3 dp cap as amounts >= 1 (swap HIVE leg, market rates).
  if (firstSig === 0) {
    return truncateNumericString(raw, WALLET_HISTORY_LARGE_QUANTITY_DECIMALS);
  }

  const displayFraction = formatCompactLeadingZeroFraction(capped);

  if (!displayFraction) {
    return `${negative ? '-' : ''}${whole}`;
  }
  return `${negative ? '-' : ''}${whole}.${displayFraction}`;
}

function resolveQuantityDecimals(value: number): number {
  return Math.abs(value) >= 1
    ? WALLET_HISTORY_LARGE_QUANTITY_DECIMALS
    : WALLET_HISTORY_SMALL_QUANTITY_DECIMALS;
}

function formatIntegerQuantity(value: number): string {
  return Math.trunc(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

function formatFractionalQuantity(value: number, decimals: number): string {
  const truncated = truncateToDecimalPlaces(value, decimals);
  const hasWholePart = Math.abs(truncated) >= 1;

  return truncated.toLocaleString('en-US', {
    minimumFractionDigits: hasWholePart ? WALLET_HISTORY_LARGE_QUANTITY_DECIMALS : 0,
    maximumFractionDigits: decimals,
  });
}

/** Wallet history quantity display: trim integer zeros, truncate fractions by magnitude. */
export function formatWalletHistoryQuantity(value: unknown): string {
  const raw = typeof value === 'string' ? value : value != null ? String(value) : '';
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  const normalized = trimmed.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }

  const decimals = resolveQuantityDecimals(parsed);
  if (PLAIN_NUMERIC.test(normalized)) {
    if (Math.abs(parsed) < 1 && parsed !== 0) {
      return formatSubUnitNumericString(normalized);
    }

    const truncatedString = truncateNumericString(normalized, decimals);
    const truncatedParsed = Number.parseFloat(truncatedString);
    if (!Number.isFinite(truncatedParsed)) {
      return trimmed;
    }
    if (truncatedParsed === Math.trunc(truncatedParsed)) {
      return formatIntegerQuantity(truncatedParsed);
    }
    return formatFractionalQuantity(truncatedParsed, decimals);
  }

  const truncated = truncateToDecimalPlaces(parsed, decimals);
  if (truncated === Math.trunc(truncated)) {
    return formatIntegerQuantity(truncated);
  }

  return formatFractionalQuantity(truncated, decimals);
}

export function formatWalletHistoryAmountLabel(
  quantity: unknown,
  symbol: unknown,
): string {
  const qty = formatWalletHistoryQuantity(quantity);
  const sym = typeof symbol === 'string' ? symbol.trim() : symbol != null ? String(symbol).trim() : '';
  if (!qty) {
    return sym;
  }
  return sym ? `${qty} ${sym}` : qty;
}
