import type { SupportedCurrency } from '@opden-data-layer/core';

/** Display symbol prefixes (legacy Waivio `currencyTypes.js`). */
export const CURRENCY_SYMBOL_PREFIX: Record<SupportedCurrency, string> = {
  AUD: 'A$',
  USD: '$',
  CAD: 'C$',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
  MXN: 'MX$',
  RUB: '₽',
  CNY: '¥',
  UAH: '₴',
  CHF: '₣',
};

function moneyPrecision(absValue: number): number {
  if (absValue > 0.01 || absValue === 0 || absValue < 0.001) {
    return 2;
  }
  return 3;
}

/**
 * Format amount in display currency with symbol prefix (legacy USDDisplay).
 * @param amount — value already in target currency (not USD)
 */
export function formatMoneyLabel(amount: number, currency: SupportedCurrency): string {
  const valid = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const abs = valid === 0 ? 0 : Math.abs(valid);
  const precision = moneyPrecision(abs);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  const prefix = CURRENCY_SYMBOL_PREFIX[currency] ?? '$';
  return `${prefix} ${formatted}`;
}

/**
 * Convert USD amount to target fiat using USD-base rates map (e.g. from `legacyRateLatest`).
 * Rate for EUR means 1 USD = rate EUR.
 */
export function convertUsdAmount(
  usdAmount: number,
  currency: SupportedCurrency,
  usdBaseRates: Record<string, number>,
): number {
  if (!Number.isFinite(usdAmount)) {
    return 0;
  }
  if (currency === 'USD') {
    return usdAmount;
  }
  const rate = usdBaseRates[currency];
  if (rate == null || !Number.isFinite(rate) || rate <= 0) {
    return usdAmount;
  }
  return usdAmount * rate;
}

export function moneyLineFromUsd(
  usdAmount: number,
  currency: SupportedCurrency,
  usdBaseRates: Record<string, number>,
): { amount: number; currency: SupportedCurrency; label: string } {
  const amount = convertUsdAmount(usdAmount, currency, usdBaseRates);
  return {
    amount,
    currency,
    label: formatMoneyLabel(amount, currency),
  };
}
