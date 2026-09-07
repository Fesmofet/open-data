/**
 * Whether an incoming block may replace the stored authority snapshot for a grantor+type.
 */
export function shouldApplyAuthorityReplace(
  incomingBlock: number,
  maxUpdatedBlock: number | null,
): boolean {
  return maxUpdatedBlock === null || incomingBlock >= maxUpdatedBlock;
}
