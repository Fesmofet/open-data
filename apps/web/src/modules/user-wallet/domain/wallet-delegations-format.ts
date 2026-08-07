export function parseDelegationAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDelegationTabTotal(
  values: string[],
  { isRc = false }: { isRc?: boolean } = {},
): string {
  const sum = values.reduce((acc, value) => acc + parseDelegationAmount(value), 0);
  return sum.toLocaleString('en-US', {
    minimumFractionDigits: isRc ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function sumOutgoingDelegationTotal(
  outgoing: ReadonlyArray<{ quantity: string }>,
): number {
  return outgoing.reduce((acc, row) => acc + parseDelegationAmount(row.quantity), 0);
}

export function sortDelegationsByQuantityDesc<T extends { quantity: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => parseDelegationAmount(b.quantity) - parseDelegationAmount(a.quantity),
  );
}
