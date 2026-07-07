import { buildWithdrawTokenList } from './build-withdraw-token-list';

describe('buildWithdrawTokenList', () => {
  it('builds WAIV and direct SWAP withdraw routes with balances', () => {
    const result = buildWithdrawTokenList({
      pairs: [
        { from_coin_symbol: 'SWAP.LTC', to_coin_symbol: 'LTC' },
        { from_coin_symbol: 'SWAP.BTC', to_coin_symbol: 'BTC' },
      ],
      coins: [
        { symbol: 'WAIV', display_name: 'WAIV' },
        { symbol: 'SWAP.LTC', display_name: 'SWAP.LTC' },
      ],
      balances: new Map([
        ['WAIV', '10'],
        ['SWAP.LTC', '0.5'],
        ['SWAP.BTC', '0'],
      ]),
      precisionBySymbol: new Map([
        ['WAIV', 8],
        ['SWAP.LTC', 8],
      ]),
    });

    expect(result[0]?.label).toBe('WAIV - HIVE');
    expect(result.map((item) => item.label)).toContain('SWAP.LTC');
    expect(result).toHaveLength(6);
    expect(result.find((item) => item.label === 'SWAP.LTC')).toMatchObject({
      inputSymbol: 'SWAP.LTC',
      outputSymbol: 'LTC',
      balance: '0.5',
      requiresExternalAddress: true,
    });
  });
});
