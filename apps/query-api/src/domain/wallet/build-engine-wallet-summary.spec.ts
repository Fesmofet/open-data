import { buildEngineWalletSummary } from './build-engine-wallet-summary';

describe('buildEngineWalletSummary', () => {
  it('keeps pinned SWAP tokens first in fixed order', () => {
    const summary = buildEngineWalletSummary({
      accountBalances: [
        {
          _id: 1,
          account: 'alice',
          symbol: 'DEC',
          balance: '10',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
        {
          _id: 2,
          account: 'alice',
          symbol: 'SWAP.BTC',
          balance: '0.5',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
      ],
      tokenMetadata: [
        {
          _id: 1,
          issuer: 'swap',
          symbol: 'SWAP.HIVE',
          name: 'SWAP.HIVE',
          metadata: '{}',
          precision: 8,
          maxSupply: '0',
          supply: '0',
          circulatingSupply: '0',
          stakingEnabled: false,
          unstakingCooldown: 0,
          delegationEnabled: false,
          undelegationCooldown: 0,
        },
        {
          _id: 2,
          issuer: 'swap',
          symbol: 'SWAP.LTC',
          name: 'SWAP.LTC',
          metadata: '{}',
          precision: 8,
          maxSupply: '0',
          supply: '0',
          circulatingSupply: '0',
          stakingEnabled: false,
          unstakingCooldown: 0,
          delegationEnabled: false,
          undelegationCooldown: 0,
        },
        {
          _id: 3,
          issuer: 'swap',
          symbol: 'SWAP.BTC',
          name: 'SWAP.BTC',
          metadata: '{}',
          precision: 8,
          maxSupply: '0',
          supply: '0',
          circulatingSupply: '0',
          stakingEnabled: false,
          unstakingCooldown: 0,
          delegationEnabled: false,
          undelegationCooldown: 0,
        },
        {
          _id: 4,
          issuer: 'swap',
          symbol: 'SWAP.ETH',
          name: 'SWAP.ETH',
          metadata: '{}',
          precision: 8,
          maxSupply: '0',
          supply: '0',
          circulatingSupply: '0',
          stakingEnabled: false,
          unstakingCooldown: 0,
          delegationEnabled: false,
          undelegationCooldown: 0,
        },
        {
          _id: 5,
          issuer: 'dec',
          symbol: 'DEC',
          name: 'Dark Energy Crystals',
          metadata: '{}',
          precision: 3,
          maxSupply: '0',
          supply: '0',
          circulatingSupply: '0',
          stakingEnabled: false,
          unstakingCooldown: 0,
          delegationEnabled: false,
          undelegationCooldown: 0,
        },
      ],
      swapUsdBySymbol: new Map([
        ['SWAP.HIVE', 0.25],
        ['SWAP.LTC', 100],
        ['SWAP.BTC', 50000],
        ['SWAP.ETH', 3000],
      ]),
      marketMetrics: [
        {
          _id: 1,
          symbol: 'DEC',
          volume: '0',
          lastPrice: '0.001',
          lowestAsk: '0',
          highestBid: '0',
          lastDayPrice: '0',
          lastDayVolume: '0',
          lastDayLowestAsk: '0',
          lastDayHighestBid: '0',
        },
      ],
      hiveUsd: 0.25,
    });

    expect(summary.pinnedTokens.map((row) => row.symbol)).toEqual([
      'SWAP.HIVE',
      'SWAP.LTC',
      'SWAP.BTC',
      'SWAP.ETH',
    ]);
    expect(summary.pinnedTokens.every((row) => row.isPinned)).toBe(true);
    expect(summary.tokens).toHaveLength(1);
    expect(summary.tokens[0]?.symbol).toBe('DEC');
    expect(summary.estimatedAccountValueUsd).toBeGreaterThan(0);
  });

  it('hides non-SWAP tokens below minimum display balance', () => {
    const summary = buildEngineWalletSummary({
      accountBalances: [
        {
          _id: 1,
          account: 'alice',
          symbol: 'DUST',
          balance: '0.0001',
          stake: '0',
          pendingUnstake: '0',
          delegationsIn: '0',
          delegationsOut: '0',
          pendingUndelegations: '0',
        },
      ],
      tokenMetadata: [],
      swapUsdBySymbol: new Map([
        ['SWAP.HIVE', 0],
        ['SWAP.LTC', 0],
        ['SWAP.BTC', 0],
        ['SWAP.ETH', 0],
      ]),
      marketMetrics: [],
      hiveUsd: 0,
    });

    expect(summary.tokens).toHaveLength(0);
    expect(summary.pinnedTokens).toHaveLength(4);
  });
});
