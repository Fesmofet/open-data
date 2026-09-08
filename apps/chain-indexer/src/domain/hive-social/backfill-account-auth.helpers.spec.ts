import {
  BACKFILL_ACCOUNT_AUTH_DEFAULT_DELAY_MS,
  BACKFILL_ACCOUNT_AUTH_MAX_BATCH,
  clampBackfillBatchSize,
  nextKeysetAccountNames,
  nextLookupAccountsLowerBound,
  nextUserBatchCursor,
  resolveBackfillDelayMs,
  shouldSkipSyncedAccount,
  isValidHiveAccountName,
} from './backfill-account-auth.helpers';

describe('backfill-account-auth.helpers', () => {
  it('clamps batch size to 100', () => {
    expect(clampBackfillBatchSize(1000)).toBe(BACKFILL_ACCOUNT_AUTH_MAX_BATCH);
    expect(clampBackfillBatchSize(50)).toBe(50);
  });

  it('defaults delay to 250ms', () => {
    expect(resolveBackfillDelayMs(undefined, undefined)).toBe(
      BACKFILL_ACCOUNT_AUTH_DEFAULT_DELAY_MS,
    );
  });

  it('honors --delay-ms override', () => {
    expect(resolveBackfillDelayMs(500, '250')).toBe(500);
  });

  it('skips synced accounts unless force', () => {
    const synced = new Set(['flowmaster']);
    expect(shouldSkipSyncedAccount('flowmaster', synced, false)).toBe(true);
    expect(shouldSkipSyncedAccount('flowmaster', synced, true)).toBe(false);
  });

  it('keyset resumes after last processed name', () => {
    const page = nextKeysetAccountNames(['alpha', 'beta', 'zeta'], 'alpha', 10);
    expect(page).toEqual(['beta', 'zeta']);
  });

  it('advances lookup_accounts lower bound past last name', () => {
    expect(nextLookupAccountsLowerBound('alice')).toBe('alice\0');
    expect(nextLookupAccountsLowerBound('')).toBe('');
  });

  it('does not advance user batch cursor when RPC returns no accounts', () => {
    expect(nextUserBatchCursor('alpha', [])).toBe('alpha');
  });

  it('advances user batch cursor to max applied name', () => {
    expect(nextUserBatchCursor('alpha', ['beta', 'zeta'])).toBe('zeta');
  });

  it('validates hive account names', () => {
    expect(isValidHiveAccountName('flowmaster')).toBe(true);
    expect(isValidHiveAccountName('grampo')).toBe(true);
    expect(isValidHiveAccountName('waivio.app')).toBe(true);
    expect(isValidHiveAccountName('ab')).toBe(false);
    expect(isValidHiveAccountName('toolongaccountnamemorethan16')).toBe(false);
    expect(isValidHiveAccountName('invalid_underscore')).toBe(false);
    expect(isValidHiveAccountName('InvalidCapital')).toBe(false);
  });
});
