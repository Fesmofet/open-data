import { walletTabFromAmount, walletTabFromSymbol, walletTabFromSwapLegs } from './links';

describe('walletTabFromSymbol', () => {
  it('maps WAIV and WP to WAIV tab', () => {
    expect(walletTabFromSymbol('WAIV')).toBe('WAIV');
    expect(walletTabFromSymbol('wp')).toBe('WAIV');
  });

  it('maps HIVE family to HIVE tab', () => {
    expect(walletTabFromSymbol('HIVE')).toBe('HIVE');
    expect(walletTabFromSymbol('HP')).toBe('HIVE');
    expect(walletTabFromSymbol('HBD')).toBe('HIVE');
    expect(walletTabFromSymbol('VESTS')).toBe('HIVE');
  });

  it('maps other symbols to ENGINE tab', () => {
    expect(walletTabFromSymbol('BEE')).toBe('ENGINE');
  });

  it('defaults empty symbol to HIVE tab', () => {
    expect(walletTabFromSymbol('')).toBe('HIVE');
    expect(walletTabFromSymbol('   ')).toBe('HIVE');
  });
});

describe('walletTabFromAmount', () => {
  it('parses currency from amount string', () => {
    expect(walletTabFromAmount('0.001 HIVE')).toBe('HIVE');
    expect(walletTabFromAmount('1.616380 VESTS')).toBe('HIVE');
  });
});

describe('walletTabFromSwapLegs', () => {
  it('returns WAIV when either leg is WAIV', () => {
    expect(walletTabFromSwapLegs('SWAP.HIVE', 'WAIV')).toBe('WAIV');
    expect(walletTabFromSwapLegs('WAIV', 'DEC')).toBe('WAIV');
  });

  it('returns ENGINE when neither leg is WAIV', () => {
    expect(walletTabFromSwapLegs('SWAP.HIVE', 'DEC')).toBe('ENGINE');
  });
});
