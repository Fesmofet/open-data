import {
  isDoubleSwapToWaiv,
  pickDefaultSwapSymbols,
  resolveInitialSwapSymbols,
  type SwapListToken,
} from './swap-modal-defaults';

function peggedToken(symbol: 'SWAP.LTC' | 'SWAP.BTC' | 'SWAP.HIVE'): SwapListToken {
  return {
    symbol,
    name: symbol,
    balance: '1',
    precision: 8,
    iconUrl: null,
    pairs: [{ symbol: 'SWAP.HIVE', tokenPair: `${symbol}:SWAP.HIVE`, precision: 8 }],
  };
}

function swapLtcWithWaivDirectPair(): SwapListToken {
  return {
    symbol: 'SWAP.LTC',
    name: 'SWAP.LTC',
    balance: '1',
    precision: 8,
    iconUrl: null,
    pairs: [
      { symbol: 'SWAP.HIVE', tokenPair: 'SWAP.LTC:SWAP.HIVE', precision: 8 },
      { symbol: 'WAIV', tokenPair: 'SWAP.LTC:WAIV', precision: 8 },
    ],
  };
}

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

describe('isDoubleSwapToWaiv', () => {
  it('returns true for pegged tokens to WAIV', () => {
    expect(isDoubleSwapToWaiv('SWAP.LTC', 'WAIV')).toBe(true);
    expect(isDoubleSwapToWaiv('SWAP.BTC', 'WAIV')).toBe(true);
  });

  it('returns true for WAIV to pegged tokens', () => {
    expect(isDoubleSwapToWaiv('WAIV', 'SWAP.LTC')).toBe(true);
    expect(isDoubleSwapToWaiv('WAIV', 'SWAP.BTC')).toBe(true);
  });

  it('returns false for non-double-hop pairs', () => {
    expect(isDoubleSwapToWaiv('SWAP.LTC', 'SWAP.HIVE')).toBe(false);
    expect(isDoubleSwapToWaiv('SWAP.HIVE', 'WAIV')).toBe(false);
    expect(isDoubleSwapToWaiv('BEE', 'WAIV')).toBe(false);
  });
});

describe('resolveInitialSwapSymbols', () => {
  it('resolves SWAP.LTC to WAIV without a direct pair', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.LTC')], 'SWAP.LTC', 'WAIV'),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'WAIV' });
  });

  it('resolves SWAP.BTC to WAIV without a direct pair', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.BTC')], 'SWAP.BTC', 'WAIV'),
    ).toEqual({ fromSymbol: 'SWAP.BTC', toSymbol: 'WAIV' });
  });

  it('keeps direct pair selection when requested', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.LTC')], 'SWAP.LTC', 'SWAP.HIVE'),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'SWAP.HIVE' });
  });

  it('resolves SWAP.HIVE to WAIV via direct pair', () => {
    expect(
      resolveInitialSwapSymbols(
        [
          {
            symbol: 'SWAP.HIVE',
            name: 'SWAP.HIVE',
            balance: '1',
            precision: 8,
            iconUrl: null,
            pairs: [
              { symbol: 'WAIV', tokenPair: 'SWAP.HIVE:WAIV', precision: 8 },
            ],
          },
        ],
        'SWAP.HIVE',
        'WAIV',
      ),
    ).toEqual({ fromSymbol: 'SWAP.HIVE', toSymbol: 'WAIV' });
  });

  it('falls back to first direct pair for invalid toSymbol', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.LTC')], 'SWAP.LTC', 'INVALID'),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'SWAP.HIVE' });
  });

  it('uses defaults when fromSymbol is unknown', () => {
    const tokens = [
      {
        symbol: 'WAIV',
        name: 'WAIV',
        balance: '3',
        precision: 8,
        iconUrl: null,
        pairs: [{ symbol: 'SWAP.HIVE', tokenPair: 'WAIV:SWAP.HIVE', precision: 8 }],
      },
    ];
    expect(resolveInitialSwapSymbols(tokens, 'UNKNOWN', 'WAIV')).toEqual(
      pickDefaultSwapSymbols(tokens),
    );
  });

  it('trims and uppercases symbol inputs', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.LTC')], ' swap.ltc ', ' waiv '),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'WAIV' });
  });

  it('falls back to first pair when toSymbol is empty', () => {
    expect(
      resolveInitialSwapSymbols([peggedToken('SWAP.LTC')], 'SWAP.LTC', ''),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'SWAP.HIVE' });
  });

  it('uses defaults when fromSymbol is omitted', () => {
    const tokens = [
      {
        symbol: 'WAIV',
        name: 'WAIV',
        balance: '3',
        precision: 8,
        iconUrl: null,
        pairs: [{ symbol: 'SWAP.HIVE', tokenPair: 'WAIV:SWAP.HIVE', precision: 8 }],
      },
    ];
    expect(resolveInitialSwapSymbols(tokens)).toEqual(pickDefaultSwapSymbols(tokens));
  });

  it('prefers direct WAIV pair over double-hop when both exist', () => {
    expect(
      resolveInitialSwapSymbols(
        [swapLtcWithWaivDirectPair()],
        'SWAP.LTC',
        'WAIV',
      ),
    ).toEqual({ fromSymbol: 'SWAP.LTC', toSymbol: 'WAIV' });
  });
});
