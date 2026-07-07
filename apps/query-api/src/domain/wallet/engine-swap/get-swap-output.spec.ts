import { getSwapOutput } from './get-swap-output';

const POOL = {
  tokenPair: 'SWAP.HIVE:WAIV',
  baseQuantity: '1000',
  quoteQuantity: '5000',
  basePrice: '5',
  quotePrice: '0.2',
  precision: 8,
};

describe('getSwapOutput', () => {
  it('returns amountOut and custom json for exact input swap', () => {
    const result = getSwapOutput({
      symbol: 'WAIV',
      amountIn: '10',
      pool: POOL,
      slippage: 0.005,
      from: true,
      tradeFeeMul: '0.9975',
      precision: 8,
    });

    expect(result).not.toBeNull();
    expect(Number.parseFloat(result!.amountOut)).toBeGreaterThan(0);
    expect(Number.parseFloat(result!.priceImpact)).toBeGreaterThanOrEqual(0);
    const parsed = JSON.parse(result!.json) as {
      contractName: string;
      contractAction: string;
    };
    expect(parsed.contractName).toBe('marketpools');
    expect(parsed.contractAction).toBe('swapTokens');
  });

  it('does not apply withdraw validation (AMM only)', () => {
    const result = getSwapOutput({
      symbol: 'SWAP.BTC',
      amountIn: '0.00001',
      pool: {
        ...POOL,
        tokenPair: 'SWAP.HIVE:SWAP.BTC',
      },
      slippage: 0.005,
      from: true,
      tradeFeeMul: '0.9975',
      precision: 8,
    });
    expect(result).not.toBeNull();
    expect(result!.amountOut).toBeDefined();
  });
});
