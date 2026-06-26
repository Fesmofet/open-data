import { calcDepositWithdrawals } from '@opden-data-layer/core/waiv-advanced-report';

import type { WaivAdvancedReportRowApi } from '../dto/waiv-advanced-report-api.schema';

function rowKey(row: WaivAdvancedReportRowApi): string {
  return `${row.userName}:${row.operationIndex}`;
}

function compareRows(a: WaivAdvancedReportRowApi, b: WaivAdvancedReportRowApi): number {
  return b.timestamp - a.timestamp || b.operationIndex - a.operationIndex;
}

function sortRows(rows: WaivAdvancedReportRowApi[]): WaivAdvancedReportRowApi[] {
  return [...rows].sort(compareRows);
}

function mergeSortedDesc(
  left: readonly WaivAdvancedReportRowApi[],
  right: readonly WaivAdvancedReportRowApi[],
): WaivAdvancedReportRowApi[] {
  const merged: WaivAdvancedReportRowApi[] = [];
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

export function dedupeIncomingWaivAdvancedReportRows(
  existing: readonly WaivAdvancedReportRowApi[],
  incoming: readonly WaivAdvancedReportRowApi[],
): WaivAdvancedReportRowApi[] {
  if (incoming.length === 0) {
    return [];
  }

  const seen = new Set(existing.map(rowKey));
  const appended: WaivAdvancedReportRowApi[] = [];

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

export function appendWaivAdvancedReportWalletPage(
  existing: readonly WaivAdvancedReportRowApi[],
  incoming: readonly WaivAdvancedReportRowApi[],
): WaivAdvancedReportRowApi[] {
  const appended = dedupeIncomingWaivAdvancedReportRows(existing, incoming);
  if (appended.length === 0) {
    return existing.length === 0 ? [] : [...existing];
  }

  const sortedIncoming = sortRows(appended);
  if (existing.length === 0) {
    return sortedIncoming;
  }

  return mergeSortedDesc(existing, sortedIncoming);
}

export function totalsFromWaivAdvancedReportWallet(
  wallet: readonly WaivAdvancedReportRowApi[],
): { deposits: number; withdrawals: number } {
  return calcDepositWithdrawals(
    wallet.map((row) => ({
      withdrawDeposit: row.withdrawDeposit,
      checked: row.checked,
      totalFiat: row.totalFiat,
    })),
  );
}
