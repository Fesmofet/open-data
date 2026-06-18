/**
 * Converts vesting shares to HP (Hive Power) using chain global properties.
 * Port of legacy steemitFormatter.vestToSteem / fromVestsToHP.
 */
function parseAssetNumber(value: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const numeric = value.trim().split(/\s+/)[0];
  const parsed = parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function vestToHp(
  vestingShares: string | number,
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
