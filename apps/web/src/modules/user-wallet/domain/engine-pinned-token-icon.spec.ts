import { getEnginePinnedTokenFallbackIconSrc } from './engine-pinned-token-icon';

describe('getEnginePinnedTokenFallbackIconSrc', () => {
  it('returns local icons for pinned SWAP tokens', () => {
    expect(getEnginePinnedTokenFallbackIconSrc('SWAP.HIVE')).toBe(
      '/images/icons/cryptocurrencies/hive.png',
    );
    expect(getEnginePinnedTokenFallbackIconSrc('SWAP.LTC')).toBe(
      '/images/icons/cryptocurrencies/litecoin.png',
    );
    expect(getEnginePinnedTokenFallbackIconSrc('SWAP.BTC')).toBe(
      '/images/icons/cryptocurrencies/bitcoin.png',
    );
  });

  it('returns null for disabled pegged symbols', () => {
    expect(getEnginePinnedTokenFallbackIconSrc('SWAP.ETH')).toBeNull();
  });

  it('returns null for non-pinned symbols', () => {
    expect(getEnginePinnedTokenFallbackIconSrc('DEC')).toBeNull();
    expect(getEnginePinnedTokenFallbackIconSrc('WAIV')).toBeNull();
  });
});
