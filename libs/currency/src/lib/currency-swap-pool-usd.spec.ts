import { computeSwapPoolUsdRows } from './currency-swap-pool-usd';

describe('computeSwapPoolUsdRows', () => {
  it('returns SWAP.HIVE from effective hive usd', () => {
    const rows = computeSwapPoolUsdRows({
      pools: [],
      hiveUsd: 0.25,
      hbdUsd: 1,
      symbols: ['SWAP.HIVE'],
    });

    expect(rows).toEqual([{ symbol: 'SWAP.HIVE', USD: 0.25 }]);
  });

  it('scales pegged swap token from pool quote price', () => {
    const rows = computeSwapPoolUsdRows({
      pools: [
        {
          tokenPair: 'SWAP.HIVE:SWAP.BTC',
          basePrice: '0.00001',
          quotePrice: '90000',
        } as never,
      ],
      hiveUsd: 0.25,
      hbdUsd: 1,
      symbols: ['SWAP.BTC'],
    });

    expect(rows[0]?.USD).toBeCloseTo(22500);
  });
});
