import type { VotersPageCursor } from './voters-cursor';

export type VoterSortableRow = {
  voter: string;
};

export type ScoredVoterRow<T extends VoterSortableRow> = {
  row: T;
  valueUsd: number;
};

/** Fixed-precision key for stable DESC cursor pagination by fiat value. */
export function voterValueSortKey(valueUsd: number): string {
  return valueUsd.toFixed(12);
}

export function sortVotersByValueUsd<T extends VoterSortableRow>(
  rows: ScoredVoterRow<T>[],
): ScoredVoterRow<T>[] {
  return [...rows].sort((a, b) => {
    if (b.valueUsd !== a.valueUsd) {
      return b.valueUsd - a.valueUsd;
    }
    return a.row.voter.localeCompare(b.row.voter);
  });
}

export function sliceVotersAfterCursor<T extends VoterSortableRow>(
  rows: ScoredVoterRow<T>[],
  cursor: VotersPageCursor | null,
): ScoredVoterRow<T>[] {
  if (cursor == null) {
    return rows;
  }
  const start = rows.findIndex((entry) => isAfterCursor(entry, cursor));
  return start >= 0 ? rows.slice(start) : [];
}

function isAfterCursor<T extends VoterSortableRow>(
  entry: ScoredVoterRow<T>,
  cursor: VotersPageCursor,
): boolean {
  const key = voterValueSortKey(entry.valueUsd);
  if (key < cursor.sortKey) {
    return true;
  }
  if (key > cursor.sortKey) {
    return false;
  }
  return entry.row.voter > cursor.voter;
}
