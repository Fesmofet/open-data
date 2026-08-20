const getActiveProvider = jest.fn();

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    getActiveProvider,
  }),
}));

import { canUseKeychainMemoCrypto } from './memo-crypto-capability';

describe('canUseKeychainMemoCrypto', () => {
  beforeEach(() => {
    getActiveProvider.mockReset();
  });

  it('returns true only for keychain provider', () => {
    getActiveProvider.mockReturnValue('keychain');
    expect(canUseKeychainMemoCrypto()).toBe(true);
  });

  it('returns false for hivesigner', () => {
    getActiveProvider.mockReturnValue('hivesigner');
    expect(canUseKeychainMemoCrypto()).toBe(false);
  });

  it('returns false for hiveauth', () => {
    getActiveProvider.mockReturnValue('hiveauth');
    expect(canUseKeychainMemoCrypto()).toBe(false);
  });

  it('returns false when provider is unset', () => {
    getActiveProvider.mockReturnValue(null);
    expect(canUseKeychainMemoCrypto()).toBe(false);
  });
});
