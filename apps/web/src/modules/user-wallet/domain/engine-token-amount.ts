const AMOUNT_RE = /^\d+(\.\d{1,8})?$/;

export function parseEngineTokenAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!AMOUNT_RE.test(trimmed)) {
    return null;
  }
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function compareEngineTokenAmounts(a: string, b: string): number {
  const na = Number.parseFloat(a);
  const nb = Number.parseFloat(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) {
    return 0;
  }
  if (na === nb) {
    return 0;
  }
  return na < nb ? -1 : 1;
}

export function isEngineTokenAmountWithinMax(
  amount: string,
  maxAmount: string,
): boolean {
  return compareEngineTokenAmounts(amount, maxAmount) <= 0;
}

export function formatEngineTokenQuantity(value: number): string {
  const fixed = value.toFixed(8);
  if (!fixed.includes('.')) {
    return fixed;
  }
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

/** Display Hive Engine token amount strings without trailing zeros. */
export function formatEngineTokenAmountDisplay(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) {
    return trimmed;
  }
  return formatEngineTokenQuantity(n);
}

export function estimateEngineTokenUsdValue(
  amount: string,
  tokenUsdRate: number,
): number {
  const parsed = parseEngineTokenAmount(amount);
  const quantity = parsed ?? 0;
  if (!Number.isFinite(tokenUsdRate) || tokenUsdRate <= 0) {
    return 0;
  }
  return quantity * tokenUsdRate;
}

export function formatEngineTokenUsdEstimate(
  amount: string,
  tokenUsdRate: number,
): string {
  return estimateEngineTokenUsdValue(amount, tokenUsdRate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Locale date/time for the next WAIV power down (legacy FormattedDate + FormattedTime). */
export function formatNextPowerDownAt(
  nextUnstakeAtMs: number | null | undefined,
  locale: string,
): string | null {
  if (nextUnstakeAtMs == null || nextUnstakeAtMs <= 0) {
    return null;
  }
  const date = new Date(nextUnstakeAtMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const datePart = date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} ${timePart}`;
}

export function formatNextPowerDownSubtitle(
  nextUnstakeAtMs: number | null | undefined,
  locale: string,
  label: string,
): string {
  const formatted = formatNextPowerDownAt(nextUnstakeAtMs, locale);
  if (!formatted) {
    return label;
  }
  return `${label} ${formatted}`;
}
