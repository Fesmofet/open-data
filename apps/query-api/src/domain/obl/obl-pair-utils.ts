export function normalizePair(
  a: string,
  b: string,
): { pairLow: string; pairHigh: string } {
  const x = a.trim();
  const y = b.trim();
  return x <= y ? { pairLow: x, pairHigh: y } : { pairLow: y, pairHigh: x };
}

export function pairKey(pairLow: string, pairHigh: string): string {
  return `${pairLow}:${pairHigh}`;
}

export function filterByLedgerCutoff<T extends { created_event_seq: bigint }>(
  rows: readonly T[],
  startedSeq: bigint | null,
): T[] {
  if (startedSeq === null) {
    return [...rows];
  }
  return rows.filter((row) => row.created_event_seq >= startedSeq);
}
