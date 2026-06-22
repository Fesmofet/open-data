/**
 * Parses Hive `vesting_shares` from delegate_vesting_shares operations.
 * Legacy chain-indexer stored the numeric vests portion (without the VESTS suffix).
 */
export function parseVestingSharesFromOperation(
  value: string | number | undefined,
): number {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const numeric = Number.parseFloat(value.replace(/VESTS/i, '').trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

export function normalizeHiveAccountName(name: string): string {
  return name.trim().toLowerCase();
}
