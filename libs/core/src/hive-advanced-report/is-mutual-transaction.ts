import { HIVE_OP } from '../hive-account-history/operation-types';

export type AdvancedReportRecord = {
  type: string;
  from?: string;
  to?: string;
};

export type IsMutualTransactionParams = {
  record: AdvancedReportRecord;
  userName: string;
  filterAccounts: readonly string[];
};

const MUTUAL_FILTER_TYPES = new Set<string>([
  HIVE_OP.TRANSFER,
  HIVE_OP.TRANSFER_TO_VESTING,
  HIVE_OP.FILL_VESTING_WITHDRAW,
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
 * Returns true when a row should be excluded from deposit/withdraw totals
 * (mutual transaction between filtered accounts).
 */
export function isMutualTransaction(params: IsMutualTransactionParams): boolean {
  const { record, userName, filterAccounts } = params;

  if (!MUTUAL_FILTER_TYPES.has(record.type)) {
    return false;
  }

  if (record.type === HIVE_OP.TRANSFER) {
    const from = normalizeAccount(record.from);
    const to = normalizeAccount(record.to);
    if (from === to) {
      return true;
    }
  }

  const others = filterAccounts
    .map(normalizeAccount)
    .filter((account) => account !== normalizeAccount(userName));

  if (others.length === 0) {
    return false;
  }

  switch (record.type) {
    case HIVE_OP.TRANSFER:
      return filterFromTo(others, [record.from, record.to]);
    case HIVE_OP.TRANSFER_TO_VESTING:
    case HIVE_OP.FILL_VESTING_WITHDRAW:
      return filterFromTo(others, [record.from, record.to]);
    default:
      return false;
  }
}
