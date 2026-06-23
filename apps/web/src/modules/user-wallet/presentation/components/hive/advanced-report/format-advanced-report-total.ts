import type { SupportedCurrency } from '@opden-data-layer/core/constants';

const formatterCache = new Map<string, Intl.NumberFormat>();

/** Legacy WalletTable: `round(value, 3)` before currency display. */
function roundToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function totalFormatter(currency: string): Intl.NumberFormat {
  const code = currency.trim().toUpperCase();
  let formatter = formatterCache.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatterCache.set(code, formatter);
  }
  return formatter;
}

/** Legacy-style totals: leading currency symbol, comma thousands, 2 decimals. */
export function formatAdvancedReportTotal(
  value: number | null,
  currency: SupportedCurrency | string,
): string {
  if (value == null) {
    return '-';
  }
  return totalFormatter(currency).format(roundToThreeDecimals(value));
}
