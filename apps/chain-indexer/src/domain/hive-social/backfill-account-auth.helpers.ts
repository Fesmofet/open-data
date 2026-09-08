export const BACKFILL_ACCOUNT_AUTH_MAX_BATCH = 100;
export const BACKFILL_ACCOUNT_AUTH_DEFAULT_DELAY_MS = 250;

export function clampBackfillBatchSize(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return BACKFILL_ACCOUNT_AUTH_MAX_BATCH;
  }
  return Math.min(Math.trunc(value), BACKFILL_ACCOUNT_AUTH_MAX_BATCH);
}

export function resolveBackfillDelayMs(
  cliDelayMs: number | undefined,
  envDelayMs: string | undefined,
): number {
  if (Number.isFinite(cliDelayMs) && cliDelayMs !== undefined && cliDelayMs >= 0) {
    return cliDelayMs;
  }
  const fromEnv = envDelayMs !== undefined ? Number(envDelayMs) : NaN;
  if (Number.isFinite(fromEnv) && fromEnv >= 0) {
    return fromEnv;
  }
  return BACKFILL_ACCOUNT_AUTH_DEFAULT_DELAY_MS;
}

export function shouldSkipSyncedAccount(
  account: string,
  syncedAccounts: ReadonlySet<string>,
  force: boolean,
): boolean {
  if (force) {
    return false;
  }
  return syncedAccounts.has(account);
}

export function nextKeysetAccountNames(
  accounts: string[],
  lastAccount: string,
  batchSize: number,
): string[] {
  const sorted = [...accounts].sort((a, b) => a.localeCompare(b));
  const startIndex =
    lastAccount.length === 0
      ? 0
      : sorted.findIndex((name) => name > lastAccount);
  if (startIndex === -1) {
    return [];
  }
  return sorted.slice(startIndex, startIndex + batchSize);
}

/** Next lower bound for condenser_api.lookup_accounts (returns names >= lower). */
export function nextLookupAccountsLowerBound(lastAccount: string): string {
  if (!lastAccount) {
    return '';
  }
  return `${lastAccount}\0`;
}

/**
 * Advance users-source keyset only when at least one account was applied.
 * Returns the previous cursor when nothing was processed (RPC failure / empty response).
 */
export function nextUserBatchCursor(
  previousCursor: string,
  appliedAccountNames: string[],
): string {
  if (appliedAccountNames.length === 0) {
    return previousCursor;
  }
  return appliedAccountNames.reduce((max, name) =>
    name.localeCompare(max) > 0 ? name : max,
  );
}

/**
 * Validate standard Hive account name syntax.
 * Length 3-16 chars, lowercase alphanumeric, dashes, dots.
 * Each segment starts with letter, ends with letter or digit.
 */
export function isValidHiveAccountName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 16) {
    return false;
  }
  return /^[a-z][a-z0-9.-]{1,14}[a-z0-9]$/.test(name);
}
