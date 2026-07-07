import { pickDefaultSwapSymbols } from './swap-modal-defaults';

describe('pickDefaultSwapSymbols', () => {
  it('defaults to WAIV and SWAP.HIVE when pair exists', () => {
    expect(
      pickDefaultSwapSymbols([
        {
          symbol: 'WAIV',
          name: 'WAIV',
          balance: '3',
          precision: 8,
          iconUrl: null,
          pairs: [
            { symbol: 'SWAP.HIVE', tokenPair: 'WAIV:SWAP.HIVE', precision: 8 },
            { symbol: 'BEE', tokenPair: 'WAIV:BEE', precision: 8 },
          ],
        },
      ]),
    ).toEqual({ fromSymbol: 'WAIV', toSymbol: 'SWAP.HIVE' });
  });

  it('falls back to first token pair when WAIV is missing', () => {
    expect(
      pickDefaultSwapSymbols([
        {
          symbol: 'BEE',
          name: 'BEE',
          balance: '1',
          precision: 8,
          iconUrl: null,
          pairs: [{ symbol: 'SWAP.HIVE', tokenPair: 'BEE:SWAP.HIVE', precision: 8 }],
        },
      ]),
    ).toEqual({ fromSymbol: 'BEE', toSymbol: 'SWAP.HIVE' });
  });
});
