import type { EngineSwapListApiResponse } from '../application/dto/engine-swap-api.schema';

type SwapListToken = EngineSwapListApiResponse['tokens'][number];

const DEFAULT_TO_SYMBOL = 'SWAP.HIVE';

/** Default swap route: WAIV → SWAP.HIVE when available. */
export function pickDefaultSwapSymbols(
  tokens: readonly SwapListToken[],
): { fromSymbol: string; toSymbol: string } {
  const waiv = tokens.find((token) => token.symbol === 'WAIV');
  if (waiv) {
    const swapHive = waiv.pairs.find((pair) => pair.symbol === DEFAULT_TO_SYMBOL);
    return {
      fromSymbol: 'WAIV',
      toSymbol: swapHive?.symbol ?? waiv.pairs[0]?.symbol ?? '',
    };
  }

  const first = tokens[0];
  return {
    fromSymbol: first?.symbol ?? '',
    toSymbol: first?.pairs[0]?.symbol ?? '',
  };
}

export const SWAP_IMPACT_PERCENT_OPTIONS = [0.5, 1, 5, 10, 25, 49] as const;
