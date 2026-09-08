const HIVE_ACCOUNT_NAME_PATTERN = /^[a-z][a-z0-9.-]{1,14}[a-z0-9]$/;

export function isValidHiveAccountName(raw: string): boolean {
  const name = raw.trim().replace(/^@/, '').toLowerCase();
  if (name.length < 3 || name.length > 16) {
    return false;
  }
  return HIVE_ACCOUNT_NAME_PATTERN.test(name);
}

export function normalizeHiveAccountName(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}
