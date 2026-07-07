import { buildDepositTokenList } from './build-deposit-token-list';

describe('buildDepositTokenList', () => {
  it('merges converter pairs with coin display names and adds HIVE', () => {
    const result = buildDepositTokenList(
      [
        { from_coin_symbol: 'LTC', to_coin_symbol: 'SWAP.LTC', pair: 'LTC -> SWAP.LTC' },
        { from_coin_symbol: 'BTC', to_coin_symbol: 'SWAP.BTC' },
        { from_coin_symbol: 'SWAP.HIVE', to_coin_symbol: 'HIVE' },
      ],
      [
        { symbol: 'LTC', display_name: 'Litecoin' },
        { symbol: 'BTC', display_name: 'Bitcoin' },
      ],
    );

    expect(result.map((item) => item.symbol).sort()).toEqual(['BTC', 'HIVE', 'LTC']);
    expect(result.find((item) => item.symbol === 'LTC')).toEqual({
      symbol: 'LTC',
      displayName: 'Litecoin',
      swapSymbol: 'SWAP.LTC',
      pairLabel: 'LTC -> SWAP.LTC',
    });
    expect(result.find((item) => item.symbol === 'HIVE')).toMatchObject({
      symbol: 'HIVE',
      swapSymbol: 'SWAP.HIVE',
    });
  });
});
