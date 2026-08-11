/**
 * Converts vesting shares to HP (Hive Power) using chain global properties.
 * Port of legacy steemitFormatter.vestToSteem / fromVestsToHP.
 */
export type HiveAssetLike =
  | string
  | number
  | { amount: string | number; precision?: number };

function hiveAssetObjectToNumber(value: {
  amount: string | number;
  precision?: number;
}): number {
  const raw = parseFloat(String(value.amount));
  if (!Number.isFinite(raw)) {
    return 0;
  }
  const precision = value.precision ?? 6;
  return raw / 10 ** precision;
}

function parseAssetNumber(value: HiveAssetLike): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 0;
    }
    // condenser_api returns asset fields as integer amount (precision 6).
    if (Number.isInteger(value)) {
      return value / 1_000_000;
    }
    return value;
  }
  if (typeof value === 'object' && value !== null && 'amount' in value) {
    return hiveAssetObjectToNumber(value);
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const numeric = value.trim().split(/\s+/)[0];
  const parsed = parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Parse a Hive VESTS / asset field to a numeric vesting-shares quantity. */
export function parseHiveVestsAmount(value: HiveAssetLike): number {
  return parseAssetNumber(value);
}

export function normalizeHiveAssetAmount(value: HiveAssetLike): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '0.000000 VESTS';
    }
    const vests = Number.isInteger(value) ? value / 1_000_000 : value;
    return `${vests.toFixed(6)} VESTS`;
  }
  const precision = value.precision ?? 6;
  const numeric = hiveAssetObjectToNumber(value);
  return `${numeric.toFixed(precision)} VESTS`;
}

export function vestToHp(
  vestingShares: HiveAssetLike,
  totalVestingShares: string,
  totalVestingFundSteem: string,
): number {
  const vests = parseAssetNumber(vestingShares);
  const totalVests = parseAssetNumber(totalVestingShares);
  const totalFund = parseAssetNumber(totalVestingFundSteem);
  if (vests === 0 || totalVests === 0) {
    return 0;
  }
  return (totalFund * vests) / totalVests || 0;
}
