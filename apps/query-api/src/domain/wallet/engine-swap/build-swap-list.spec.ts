import { buildSwapListTokens } from './build-swap-list';

describe('buildSwapListTokens', () => {
  it('includes only user tokens with liquid balance > 0 that have swap pairs', () => {
    const tokens = buildSwapListTokens({
      pools: [
        {
          _id: 1,
          tokenPair: 'WAIV:SWAP.HIVE',
          baseQuantity: '1',
          baseVolume: '0',
          basePrice: '1',
          quoteQuantity: '1',
          quoteVolume: '0',
          quotePrice: '1',
          totalShares: '1',
          precision: 8,
          creator: 'test',
        },
        {
          _id: 2,
          tokenPair: 'BEE:SWAP.HIVE',
          baseQuantity: '1',
          baseVolume: '0',
          basePrice: '1',
          quoteQuantity: '1',
          quoteVolume: '0',
          quotePrice: '1',
          totalShares: '1',
          precision: 8,
          creator: 'test',
        },
      ],
      balances: [
        {
          _id: 1,
          account: 'alice',
          symbol: 'WAIV',
          balance: '3.04802501',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
        {
          _id: 2,
          account: 'alice',
          symbol: 'BEE',
          balance: '0',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
      ],
      tokenMetadata: new Map([
        ['WAIV', { name: 'WAIV', precision: 8, metadata: '{}' }],
        ['BEE', { name: 'BEE', precision: 8, metadata: '{}' }],
      ]),
    });

    expect(tokens.map((token) => token.symbol)).toEqual(['WAIV']);
    expect(tokens[0]?.pairs.map((pair) => pair.symbol)).toContain('SWAP.HIVE');
  });

  it('includes dust balances above zero', () => {
    const tokens = buildSwapListTokens({
      pools: [
        {
          _id: 1,
          tokenPair: 'BUDS:SWAP.HIVE',
          baseQuantity: '1',
          baseVolume: '0',
          basePrice: '1',
          quoteQuantity: '1',
          quoteVolume: '0',
          quotePrice: '1',
          totalShares: '1',
          precision: 8,
          creator: 'test',
        },
      ],
      balances: [
        {
          _id: 1,
          account: 'flowmaster',
          symbol: 'BUDS',
          balance: '0.00005444',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
      ],
      tokenMetadata: new Map([
        ['BUDS', { name: 'BUDS', precision: 8, metadata: '{}' }],
      ]),
    });

    expect(tokens.map((token) => token.symbol)).toEqual(['BUDS']);
    expect(tokens[0]?.balance).toBe('0.00005444');
  });

  it('excludes disabled pegged SWAP.ETH even when balance is positive', () => {
    const tokens = buildSwapListTokens({
      pools: [
        {
          _id: 1,
          tokenPair: 'SWAP.ETH:SWAP.HIVE',
          baseQuantity: '1',
          baseVolume: '0',
          basePrice: '1',
          quoteQuantity: '1',
          quoteVolume: '0',
          quotePrice: '1',
          totalShares: '1',
          precision: 8,
          creator: 'test',
        },
        {
          _id: 2,
          tokenPair: 'WAIV:SWAP.HIVE',
          baseQuantity: '1',
          baseVolume: '0',
          basePrice: '1',
          quoteQuantity: '1',
          quoteVolume: '0',
          quotePrice: '1',
          totalShares: '1',
          precision: 8,
          creator: 'test',
        },
      ],
      balances: [
        {
          _id: 1,
          account: 'alice',
          symbol: 'SWAP.ETH',
          balance: '1.5',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
        {
          _id: 2,
          account: 'alice',
          symbol: 'WAIV',
          balance: '10',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
      ],
      tokenMetadata: new Map([
        ['SWAP.ETH', { name: 'SWAP.ETH', precision: 8, metadata: '{}' }],
        ['WAIV', { name: 'WAIV', precision: 8, metadata: '{}' }],
      ]),
    });

    expect(tokens.map((token) => token.symbol)).toEqual(['WAIV']);
    expect(tokens[0]?.pairs.map((pair) => pair.symbol)).not.toContain('SWAP.ETH');
  });
});
