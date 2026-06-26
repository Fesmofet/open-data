export type WaivAdvancedReportRecord = {
  type: string;
  from?: string;
  to?: string;
};

export type IsWaivMutualTransactionParams = {
  record: WaivAdvancedReportRecord;
  userName: string;
  filterAccounts: readonly string[];
};

const WAIV_MUTUAL_FILTER_TYPES = new Set<string>([
  'tokens_transfer',
  'tokens_stake',
]);

function normalizeAccount(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function filterFromTo(
  filterAccounts: readonly string[],
  fromTo: readonly (string | undefined)[],
): boolean {
  const normalized = filterAccounts.map(normalizeAccount);
  const endpoints = fromTo.map(normalizeAccount).filter(Boolean);
  return normalized.some((account) => endpoints.includes(account));
}

/**
 * Legacy `multiAccountFilter` parity for WAIV transfer/stake rows.
 */
export function isWaivMutualTransaction(
  params: IsWaivMutualTransactionParams,
): boolean {
  const { record, userName, filterAccounts } = params;

  if (!WAIV_MUTUAL_FILTER_TYPES.has(record.type)) {
    return false;
  }

  const from = normalizeAccount(record.from);
  const to = normalizeAccount(record.to);
  if (from === to) {
    return true;
  }

  const others = filterAccounts
    .map(normalizeAccount)
    .filter((account) => account !== normalizeAccount(userName));

  if (others.length === 0) {
    return false;
  }

  return filterFromTo(others, [record.from, record.to]);
}
