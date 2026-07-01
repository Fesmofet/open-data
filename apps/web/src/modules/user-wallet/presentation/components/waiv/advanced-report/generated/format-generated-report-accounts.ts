export function formatGeneratedReportAccounts(accounts: readonly string[]): string {
  if (accounts.length === 0) {
    return '—';
  }
  return accounts
    .map((name) => `@${name.trim().replace(/^@/, '').toLowerCase()}`)
    .join(', ');
}
