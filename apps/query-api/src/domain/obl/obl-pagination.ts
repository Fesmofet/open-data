export type OffsetPage<T> = {
  items: T[];
  hasMore: boolean;
};

export type CursorPage<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export function buildOffsetPage<T>(rows: readonly T[], limit: number): OffsetPage<T> {
  const hasMore = rows.length > limit;
  return {
    items: hasMore ? rows.slice(0, limit) : [...rows],
    hasMore,
  };
}

export function encodeOblCursor(seq: bigint, id: string): string {
  return `${seq.toString()}:${id}`;
}

export function decodeOblCursor(
  cursor: string | undefined,
): { seq: bigint; id: string } | null {
  if (!cursor) {
    return null;
  }
  const trimmed = cursor.trim();
  const colon = trimmed.indexOf(':');
  if (colon <= 0) {
    return null;
  }
  const id = trimmed.slice(colon + 1).trim();
  if (id === '') {
    return null;
  }
  try {
    return { seq: BigInt(trimmed.slice(0, colon)), id };
  } catch {
    return null;
  }
}

export function buildCursorPageFromRows<T>(
  rows: readonly T[],
  limit: number,
  read: (row: T) => { seq: bigint; id: string },
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : [...rows];
  const last = items.at(-1);
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeOblCursor(read(last).seq, read(last).id)
        : null,
  };
}

export function buildCursorPage<T extends { created_event_seq: bigint; id: string }>(
  rows: readonly T[],
  limit: number,
): CursorPage<T> {
  return buildCursorPageFromRows(rows, limit, (row) => ({
    seq: row.created_event_seq,
    id: row.id,
  }));
}
