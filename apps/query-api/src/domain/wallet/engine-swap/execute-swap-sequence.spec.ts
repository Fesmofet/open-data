import {
  buildPoolsByPair,
  executeSwapSequence,
  buildDoubleSwapToWaivHops,
} from './execute-swap-sequence';

const WAIV_POOL = {
  tokenPair: 'SWAP.HIVE:WAIV',
  baseQuantity: '100000',
  quoteQuantity: '500000',
  basePrice: '5',
  quotePrice: '0.2',
  precision: 8,
};

const LTC_POOL = {
  tokenPair: 'SWAP.HIVE:SWAP.LTC',
  baseQuantity: '50000',
  quoteQuantity: '80000',
  basePrice: '1.6',
  quotePrice: '0.625',
  precision: 8,
};

describe('executeSwapSequence', () => {
  it('returns multi-hop swap json and minAmountOut for WAIV to SWAP.LTC', () => {
    const poolsByPair = buildPoolsByPair([WAIV_POOL, LTC_POOL] as never);
    const hops = buildDoubleSwapToWaivHops('WAIV', 'SWAP.LTC');
    expect(hops).not.toBeNull();

    const result = executeSwapSequence({
      hops: hops!,
      amountIn: '100',
      poolsByPair,
      tradeFeeMul: '0.9975',
      slippageFirst: 0.0001,
      slippageRest: 0.005,
    });

    expect('error' in result).toBe(false);
    if ('error' in result) {
      return;
    }
    expect(result.swapJson).toHaveLength(2);
    expect(Number.parseFloat(result.amountOut)).toBeGreaterThan(0);
    expect(Number.parseFloat(result.minAmountOut)).toBeGreaterThan(0);
    expect(Number.parseFloat(result.minAmountOut)).toBeLessThanOrEqual(
      Number.parseFloat(result.amountOut),
    );

    for (const json of result.swapJson) {
      const parsed = JSON.parse(json) as {
        contractName: string;
        contractAction: string;
      };
      expect(parsed.contractName).toBe('marketpools');
      expect(parsed.contractAction).toBe('swapTokens');
    }
  });

  it('returns error when pool is missing', () => {
    const result = executeSwapSequence({
      hops: [{ tokenPair: 'SWAP.HIVE:WAIV', inputSymbol: 'WAIV' }],
      amountIn: '10',
      poolsByPair: new Map(),
    });
    expect(result).toEqual({ error: 'market pool is unavailable' });
  });
});
