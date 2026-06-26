/** FNV-1a 32-bit hash — deterministic, positive int32 for wallet_exemptions. */
export function stableOperationIndex(parts: readonly string[]): number {
  let hash = 2_166_136_261;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      hash ^= part.charCodeAt(i);
      hash = Math.imul(hash, 16_777_619);
    }
  }
  return (hash >>> 0) % 2_147_483_647 || 1;
}

export function stableWaivAdvancedReportOperationIndex(params: {
  source: string;
  account: string;
  timestamp: number;
  tieId: string;
}): number {
  return stableOperationIndex([
    params.source,
    params.account.trim().toLowerCase(),
    String(params.timestamp),
    params.tieId,
  ]);
}
