import {
  getDefaultSwapFromSymbolForTab,
  getDefaultWalletAssetForTab,
} from './wallet-tab-defaults';

describe('wallet-tab-defaults', () => {
  describe('getDefaultWalletAssetForTab', () => {
    it('returns WAIV on WAIV tab', () => {
      expect(getDefaultWalletAssetForTab('WAIV')).toBe('WAIV');
    });

    it('returns HIVE on HIVE tab', () => {
      expect(getDefaultWalletAssetForTab('HIVE')).toBe('HIVE');
    });

    it('returns HIVE on Hive Engine tab', () => {
      expect(getDefaultWalletAssetForTab('ENGINE')).toBe('HIVE');
    });
  });

  describe('getDefaultSwapFromSymbolForTab', () => {
    it('matches wallet asset defaults', () => {
      expect(getDefaultSwapFromSymbolForTab('WAIV')).toBe('WAIV');
      expect(getDefaultSwapFromSymbolForTab('ENGINE')).toBe('HIVE');
    });
  });
});
