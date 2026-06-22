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
    return Number.isFinite(value) ? value : 0;
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

export function normalizeHiveAssetAmount(value: HiveAssetLike): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
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
