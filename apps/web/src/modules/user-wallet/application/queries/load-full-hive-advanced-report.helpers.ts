import { calcDepositWithdrawals } from '@opden-data-layer/core/hive-advanced-report';

import type { AdvancedReportRowApi } from '../dto/hive-advanced-report-api.schema';

function rowKey(row: AdvancedReportRowApi): string {
  return `${row.userName}:${row.operationIndex}`;
}

function compareRows(a: AdvancedReportRowApi, b: AdvancedReportRowApi): number {
  return b.timestamp - a.timestamp || b.operationIndex - a.operationIndex;
}

function sortRows(rows: AdvancedReportRowApi[]): AdvancedReportRowApi[] {
  return [...rows].sort(compareRows);
}

function mergeSortedDesc(
  left: readonly AdvancedReportRowApi[],
  right: readonly AdvancedReportRowApi[],
): AdvancedReportRowApi[] {
  const merged: AdvancedReportRowApi[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (compareRows(left[i], right[j]) <= 0) {
      merged.push(left[i]);
      i += 1;
    } else {
      merged.push(right[j]);
      j += 1;
    }
  }

  while (i < left.length) {
    merged.push(left[i]);
    i += 1;
  }
  while (j < right.length) {
    merged.push(right[j]);
    j += 1;
  }

  return merged;
}

export function dedupeIncomingAdvancedReportRows(
  existing: readonly AdvancedReportRowApi[],
  incoming: readonly AdvancedReportRowApi[],
): AdvancedReportRowApi[] {
  if (incoming.length === 0) {
    return [];
  }

  const seen = new Set(existing.map(rowKey));
  const appended: AdvancedReportRowApi[] = [];

  for (const row of incoming) {
    const key = rowKey(row);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    appended.push(row);
  }

  return appended;
}

/** Append one API page into a sorted wallet without re-sorting the full list. */
export function appendAdvancedReportWalletPage(
  existing: readonly AdvancedReportRowApi[],
  incoming: readonly AdvancedReportRowApi[],
): AdvancedReportRowApi[] {
  const appended = dedupeIncomingAdvancedReportRows(existing, incoming);
  if (appended.length === 0) {
    return existing.length === 0 ? [] : [...existing];
  }

  const sortedIncoming = sortRows(appended);
  if (existing.length === 0) {
    return sortedIncoming;
  }

  return mergeSortedDesc(existing, sortedIncoming);
}

export function mergeAdvancedReportWalletRows(
  existing: AdvancedReportRowApi[],
  incoming: AdvancedReportRowApi[],
): AdvancedReportRowApi[] {
  return appendAdvancedReportWalletPage(existing, incoming);
}

export function totalsFromAdvancedReportWallet(
  wallet: readonly AdvancedReportRowApi[],
): { deposits: number; withdrawals: number } {
  return calcDepositWithdrawals(
    wallet.map((row) => ({
      withdrawDeposit: row.withdrawDeposit,
      checked: row.checked,
      totalFiat: row.totalFiat,
    })),
  );
}
