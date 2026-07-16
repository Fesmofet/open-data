export function sortByCreatedAtDesc<T extends { created_at: string }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}
