/** @jest-environment jsdom */

jest.mock('../../infrastructure/providers/has/has-client', () => ({}));

const setActiveProvider = jest.fn();

jest.mock('../../infrastructure/wallet-facade.client', () => {
  const actual = jest.requireActual('../../infrastructure/wallet-facade.client');
  return {
    ...actual,
    getWalletFacade: () => ({ setActiveProvider }),
  };
});

import {
  clearHasAuthSession,
  saveHasAuthSession,
} from '../../infrastructure/providers/has/has-auth-session.storage';
import { hydrateWalletProviderFromStorage } from './hydrate-wallet-provider';
import { ODL_KEYCHAIN_PERSISTENT_KEY } from '../../infrastructure/wallet-facade.client';

describe('hydrateWalletProviderFromStorage', () => {
  beforeEach(() => {
    clearHasAuthSession();
    localStorage.clear();
    sessionStorage.clear();
    setActiveProvider.mockReset();
  });

  it('restores hiveauth when HAS session is valid', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
    });
    hydrateWalletProviderFromStorage();
    expect(setActiveProvider).toHaveBeenCalledWith('hiveauth');
  });

  it('does not restore hiveauth when HAS session is expired', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() - 60_000,
    });
    hydrateWalletProviderFromStorage();
    expect(setActiveProvider).not.toHaveBeenCalledWith('hiveauth');
  });

  it('restores keychain from localStorage marker', () => {
    localStorage.setItem(ODL_KEYCHAIN_PERSISTENT_KEY, '1');
    hydrateWalletProviderFromStorage();
    expect(setActiveProvider).toHaveBeenCalledWith('keychain');
  });
});
