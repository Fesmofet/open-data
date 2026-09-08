const HIVE_ACCOUNT_NAME_RE = /^[a-z0-9][a-z0-9.-]{2,15}$/;

export function normalizeHiveAccount(account: string): string {
  return account.trim().replace(/^@/, '').toLowerCase();
}

export function isValidHiveAccountName(account: string): boolean {
  return HIVE_ACCOUNT_NAME_RE.test(normalizeHiveAccount(account));
}
