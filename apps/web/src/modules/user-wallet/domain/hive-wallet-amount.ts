import { hpToVestingShares as coreHpToVestingShares, vestToHp } from '@opden-data-layer/core/hive-account-history';

/** Hive L1 assets (HIVE, HBD) support at most 3 decimal places on chain. */
export const HIVE_AMOUNT_MAX_DECIMAL_PLACES = 3;

const AMOUNT_RE = new RegExp(
  `^\\d+(\\.\\d{1,${HIVE_AMOUNT_MAX_DECIMAL_PLACES}})?$`,
);

function parseAssetNumber(value: string): number {
  const numeric = value.trim().split(/\s+/)[0];
  const parsed = Number.parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseHiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!AMOUNT_RE.test(trimmed)) {
    return null;
  }
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatHiveAmount(value: number, fractionDigits = 3): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

/** Truncate to chain precision for form inputs (no grouping separators). */
export function truncateHiveAmountForInput(value: string | number): string {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseFloat(
          String(value).trim().replace(/,/g, '').split(/\s+/)[0] ?? '',
        );
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '0';
  }
  const factor = 10 ** HIVE_AMOUNT_MAX_DECIMAL_PLACES;
  const truncated = Math.floor(parsed * factor) / factor;
  return truncated
    .toFixed(HIVE_AMOUNT_MAX_DECIMAL_PLACES)
    .replace(/\.?0+$/, '');
}

/** Hive requires delegating at least 1 HIVE worth of vesting shares. */
export const HIVE_MIN_DELEGATION_HIVE = 1;

export function getMinHiveDelegationHp(
  totalVestingShares: string,
  totalVestingFundSteem: string,
): number {
  const minVests = parseAssetNumber(
    hpToVestingShares(
      HIVE_MIN_DELEGATION_HIVE,
      totalVestingShares,
      totalVestingFundSteem,
    ),
  );
  const minHp = vestingSharesToHp(
    `${minVests.toFixed(6)} VESTS`,
    totalVestingShares,
    totalVestingFundSteem,
  );
  if (!Number.isFinite(minHp) || minHp <= 0) {
    return HIVE_MIN_DELEGATION_HIVE;
  }
  return minHp;
}

export function isHiveDelegationHpAboveMinimum(
  hp: number,
  totalVestingShares: string,
  totalVestingFundSteem: string,
): boolean {
  if (hp <= 0) {
    return false;
  }
  const vests = parseAssetNumber(
    hpToVestingShares(hp, totalVestingShares, totalVestingFundSteem),
  );
  const minVests = parseAssetNumber(
    hpToVestingShares(
      HIVE_MIN_DELEGATION_HIVE,
      totalVestingShares,
      totalVestingFundSteem,
    ),
  );
  return vests + 1e-6 >= minVests;
}

export function hpToVestingShares(
  hp: number,
  totalVestingShares: string,
  totalVestingFundSteem: string,
): string {
  return coreHpToVestingShares(hp, totalVestingShares, totalVestingFundSteem);
}

export function vestingSharesToHp(
  vestingShares: string,
  totalVestingShares: string,
  totalVestingFundSteem: string,
): number {
  return vestToHp(vestingShares, totalVestingShares, totalVestingFundSteem);
}

export function resolvePowerDownProgress(
  weeksRemaining: number,
  weeksTotal: number,
): { remaining: number; completed: number; total: number } {
  const remaining = Math.min(weeksTotal, Math.max(0, weeksRemaining));
  const completed = Math.max(0, weeksTotal - remaining);
  return { remaining, completed, total: weeksTotal };
}

export function formatHiveNextPowerDownDate(
  nextVestingWithdrawal: string | null | undefined,
  locale: string,
): string | undefined {
  if (!nextVestingWithdrawal) {
    return undefined;
  }
  const ms = Date.parse(nextVestingWithdrawal);
  if (!Number.isFinite(ms)) {
    return undefined;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(ms);
}

export function formatHiveNextPowerDownSubtitle(
  nextVestingWithdrawal: string | null | undefined,
  locale: string,
  label: string,
): string | undefined {
  if (!nextVestingWithdrawal) {
    return undefined;
  }
  const ms = Date.parse(nextVestingWithdrawal);
  if (!Number.isFinite(ms)) {
    return undefined;
  }
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(ms);
  return `${label}: ${formatted}`;
}

export function estimateHiveUsdValue(
  amount: string,
  usdRate: number,
): string {
  const numeric = amount.trim().replace(/,/g, '').split(/\s+/)[0] ?? '';
  const parsed = Number.parseFloat(numeric);
  const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    return '0.00';
  }
  return (quantity * usdRate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
