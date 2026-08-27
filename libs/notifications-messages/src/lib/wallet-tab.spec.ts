import { walletTabFromAmount, walletTabFromSymbol } from './links';

describe('walletTabFromSymbol', () => {
  it('maps WAIV and WP to WAIV tab', () => {
    expect(walletTabFromSymbol('WAIV')).toBe('WAIV');
    expect(walletTabFromSymbol('wp')).toBe('WAIV');
  });

  it('maps HIVE, HP, HBD, and VESTS to HIVE tab', () => {
    expect(walletTabFromSymbol('HIVE')).toBe('HIVE');
    expect(walletTabFromSymbol('HP')).toBe('HIVE');
    expect(walletTabFromSymbol('HBD')).toBe('HIVE');
    expect(walletTabFromSymbol('VESTS')).toBe('HIVE');
  });

  it('maps unknown symbols to ENGINE tab', () => {
    expect(walletTabFromSymbol('BEE')).toBe('ENGINE');
  });

  it('defaults empty symbol to HIVE tab', () => {
    expect(walletTabFromSymbol('')).toBe('HIVE');
    expect(walletTabFromSymbol('   ')).toBe('HIVE');
  });
});

describe('walletTabFromAmount', () => {
  it('parses HIVE amount strings', () => {
    expect(walletTabFromAmount('0.001 HIVE')).toBe('HIVE');
  });

  it('parses WAIV amount strings', () => {
    expect(walletTabFromAmount('0.001 WAIV')).toBe('WAIV');
  });

  it('parses VESTS power down amounts', () => {
    expect(walletTabFromAmount('1.616380 VESTS')).toBe('HIVE');
  });

  it('defaults bare amounts without currency to HIVE tab', () => {
    expect(walletTabFromAmount('0.001')).toBe('HIVE');
  });
});
