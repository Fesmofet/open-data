import { ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS } from '@opden-data-layer/core/hive-engine-history';

import type { EngineSwapListApiResponse } from '../application/dto/engine-swap-api.schema';

export type SwapListToken = EngineSwapListApiResponse['tokens'][number];

const DEFAULT_TO_SYMBOL = 'SWAP.HIVE';
const WAIV_SYMBOL = 'WAIV';

const DOUBLE_SWAP_TO_WAIV = ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS as readonly string[];

/** Default swap route: WAIV → SWAP.HIVE when available. */
export function pickDefaultSwapSymbols(
  tokens: readonly SwapListToken[],
): { fromSymbol: string; toSymbol: string } {
  const waiv = tokens.find((token) => token.symbol === WAIV_SYMBOL);
  if (waiv) {
    const swapHive = waiv.pairs.find((pair) => pair.symbol === DEFAULT_TO_SYMBOL);
    return {
      fromSymbol: WAIV_SYMBOL,
      toSymbol: swapHive?.symbol ?? waiv.pairs[0]?.symbol ?? '',
    };
  }

  const first = tokens[0];
  return {
    fromSymbol: first?.symbol ?? '',
    toSymbol: first?.pairs[0]?.symbol ?? '',
  };
}

export function isDoubleSwapToWaiv(fromSymbol: string, toSymbol: string): boolean {
  const from = fromSymbol.trim().toUpperCase();
  const to = toSymbol.trim().toUpperCase();
  return (
    (from === WAIV_SYMBOL && DOUBLE_SWAP_TO_WAIV.includes(to)) ||
    (to === WAIV_SYMBOL && DOUBLE_SWAP_TO_WAIV.includes(from))
  );
}

export function resolveInitialSwapSymbols(
  tokens: readonly SwapListToken[],
  fromSymbol?: string,
  toSymbol?: string,
): { fromSymbol: string; toSymbol: string } {
  const defaults = pickDefaultSwapSymbols(tokens);
  if (!fromSymbol?.trim()) {
    return defaults;
  }
  const from = fromSymbol.trim().toUpperCase();
  const fromToken = tokens.find((token) => token.symbol === from);
  if (!fromToken) {
    return defaults;
  }
  const to = toSymbol?.trim().toUpperCase();
  if (to && fromToken.pairs.some((pair) => pair.symbol === to)) {
    return { fromSymbol: from, toSymbol: to };
  }
  if (to && isDoubleSwapToWaiv(from, to)) {
    return { fromSymbol: from, toSymbol: to };
  }
  return {
    fromSymbol: from,
    toSymbol: fromToken.pairs[0]?.symbol ?? defaults.toSymbol,
  };
}

export const SWAP_IMPACT_PERCENT_OPTIONS = [0.5, 1, 5, 10, 25, 49] as const;
