import type { EngineWalletSummaryView } from './types/engine-wallet-view';

export function findEngineTokenUsdRate(
  symbol: string,
  waivUsd: number,
  engineSummary: EngineWalletSummaryView | null,
): number {
  if (symbol === 'WAIV') {
    return waivUsd;
  }
  if (!engineSummary) {
    return 0;
  }
  const row = [...engineSummary.pinnedTokens, ...engineSummary.tokens].find(
    (token) => token.symbol === symbol,
  );
  if (!row) {
    return 0;
  }
  const balance = Number.parseFloat(row.balance);
  if (!Number.isFinite(balance) || balance <= 0) {
    return 0;
  }
  return row.usdEstimate / balance;
}
