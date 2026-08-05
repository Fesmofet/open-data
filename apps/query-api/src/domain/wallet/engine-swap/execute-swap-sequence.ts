import BigNumber from 'bignumber.js';

import type { HiveEngineMarketPool } from '@opden-data-layer/clients';
import { ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS } from '@opden-data-layer/core/hive-engine-history';

import {
  DEFAULT_TRADE_FEE_MUL,
  DEFAULT_WITHDRAW_SLIPPAGE,
  DEFAULT_WITHDRAW_SLIPPAGE_MAX,
} from './engine-swap.constants';
import { getSwapOutput } from './get-swap-output';

export type SwapHopInput = {
  tokenPair: string;
  inputSymbol: string;
};

export type ExecuteSwapSequenceInput = {
  hops: readonly SwapHopInput[];
  amountIn: string;
  poolsByPair: ReadonlyMap<string, HiveEngineMarketPool>;
  tradeFeeMul?: string;
  slippageFirst?: number;
  slippageRest?: number;
};

export type ExecuteSwapSequenceResult = {
  swapJson: string[];
  amountOut: string;
  minAmountOut: string;
  priceImpact: string;
};

export function executeSwapSequence(
  input: ExecuteSwapSequenceInput,
): ExecuteSwapSequenceResult | { error: string } {
  const tradeFeeMul = input.tradeFeeMul ?? DEFAULT_TRADE_FEE_MUL;
  const swapJson: string[] = [];
  let amount = input.amountIn;
  let lastImpact = '0';
  let lastAmountOut = '0';
  let lastMinOut = '0';

  for (const [index, hop] of input.hops.entries()) {
    const pool = input.poolsByPair.get(hop.tokenPair);
    if (!pool) {
      return { error: 'market pool is unavailable' };
    }

    const slippage =
      index === 0
        ? (input.slippageFirst ?? DEFAULT_WITHDRAW_SLIPPAGE)
        : (input.slippageRest ?? DEFAULT_WITHDRAW_SLIPPAGE_MAX);

    const result = getSwapOutput({
      symbol: hop.inputSymbol,
      amountIn: amount,
      pool,
      slippage,
      from: true,
      tradeFeeMul,
      precision: pool.precision,
    });

    if (!result) {
      return { error: 'swap calculation failed' };
    }

    swapJson.push(result.json);
    amount = result.minAmountOut;
    lastAmountOut = result.amountOut;
    lastMinOut = result.minAmountOut;
    lastImpact = result.priceImpact;
  }

  return {
    swapJson,
    amountOut: lastAmountOut,
    minAmountOut: lastMinOut,
    priceImpact: lastImpact,
  };
}

export function buildPoolsByPair(
  pools: readonly HiveEngineMarketPool[],
): Map<string, HiveEngineMarketPool> {
  return new Map(pools.map((pool) => [pool.tokenPair, pool]));
}

export function isDoubleSwapToWaiv(fromSymbol: string, toSymbol: string): boolean {
  const doubleSwapSymbols = ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS as readonly string[];
  return (
    (fromSymbol === 'WAIV' && doubleSwapSymbols.includes(toSymbol)) ||
    (toSymbol === 'WAIV' && doubleSwapSymbols.includes(fromSymbol))
  );
}

/** Two-hop route: SWAP.{LTC|BTC} <-> WAIV via SWAP.HIVE. */
export function buildDoubleSwapToWaivHops(
  fromSymbol: string,
  toSymbol: string,
): SwapHopInput[] | null {
  const doubleSwapSymbols = ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS as readonly string[];
  if (fromSymbol === 'WAIV' && doubleSwapSymbols.includes(toSymbol)) {
    return [
      { tokenPair: 'SWAP.HIVE:WAIV', inputSymbol: 'WAIV' },
      { tokenPair: `SWAP.HIVE:${toSymbol}`, inputSymbol: 'SWAP.HIVE' },
    ];
  }
  if (toSymbol === 'WAIV' && doubleSwapSymbols.includes(fromSymbol)) {
    return [
      { tokenPair: `SWAP.HIVE:${fromSymbol}`, inputSymbol: fromSymbol },
      { tokenPair: 'SWAP.HIVE:WAIV', inputSymbol: 'SWAP.HIVE' },
    ];
  }
  return null;
}

export function fixedEngineAmount(value: string | number, precision: number): string {
  return new BigNumber(value).toFixed(precision, BigNumber.ROUND_DOWN);
}
