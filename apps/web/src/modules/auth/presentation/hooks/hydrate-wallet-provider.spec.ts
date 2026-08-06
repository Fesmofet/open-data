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
import { ODL_HS_TOKEN_STORAGE_KEY } from '../../infrastructure/hivesigner-token.constants';
import {
  ODL_KEYCHAIN_PERSISTENT_KEY,
  ODL_WALLET_PROVIDER_SESSION_KEY,
} from '../../infrastructure/wallet-facade.client';

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

  it('prefers hivesigner over keychain marker when HS token exists', () => {
    localStorage.setItem(ODL_KEYCHAIN_PERSISTENT_KEY, '1');
    localStorage.setItem(ODL_WALLET_PROVIDER_SESSION_KEY, 'hivesigner');
    localStorage.setItem(ODL_HS_TOKEN_STORAGE_KEY, 'hs-token');

    hydrateWalletProviderFromStorage();

    expect(setActiveProvider).toHaveBeenCalledWith('hivesigner');
    expect(localStorage.getItem(ODL_KEYCHAIN_PERSISTENT_KEY)).toBeNull();
  });

  it('prefers hivesigner over valid HAS session when HS token exists', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
    });
    localStorage.setItem(ODL_WALLET_PROVIDER_SESSION_KEY, 'hivesigner');
    localStorage.setItem(ODL_HS_TOKEN_STORAGE_KEY, 'hs-token');

    hydrateWalletProviderFromStorage();

    expect(setActiveProvider).toHaveBeenCalledWith('hivesigner');
    expect(setActiveProvider).not.toHaveBeenCalledWith('hiveauth');
  });
});
