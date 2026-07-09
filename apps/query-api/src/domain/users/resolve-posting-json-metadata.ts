/**
 * Prefer live Hive `posting_json_metadata` over Postgres (legacy `getInfoForSideBar` parity).
 */
export function resolvePostingJsonMetadata(
  dbValue: string | null | undefined,
  chainValue: string | null | undefined,
): string | null {
  const chain = chainValue?.trim() ?? '';
  if (chain.length > 0) {
    return chain;
  }
  const db = dbValue?.trim() ?? '';
  return db.length > 0 ? db : null;
}
