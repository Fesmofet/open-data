/**
 * Converts vesting shares to HP (Hive Power) using chain global properties.
 * Port of legacy steemitFormatter.vestToSteem / fromVestsToHP.
 */
export function vestToHp(
  vestingShares: string | number,
  totalVestingShares: string,
  totalVestingFundSteem: string,
): number {
  const vests = typeof vestingShares === 'number' ? vestingShares : parseFloat(vestingShares);
  const totalVests = parseFloat(totalVestingShares);
  const totalFund = parseFloat(totalVestingFundSteem);
  if (!Number.isFinite(vests) || !Number.isFinite(totalVests) || totalVests === 0) {
    return 0;
  }
  return (totalFund * vests) / totalVests || 0;
}
