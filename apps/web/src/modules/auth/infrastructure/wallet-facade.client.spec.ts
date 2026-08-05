/** @jest-environment jsdom */

jest.mock('./providers/has/has-client', () => ({}));

const setActiveProvider = jest.fn();

jest.mock('./wallet-facade', () => ({
  createWalletFacade: () => ({
    setActiveProvider,
    login: jest.fn(),
    broadcast: jest.fn(),
  }),
}));

import {
  clearHasAuthSession,
  ODL_HIVEAUTH_SESSION_KEY,
  saveHasAuthSession,
} from './providers/has/has-auth-session.storage';
import {
  clearWalletSession,
  ODL_KEYCHAIN_PERSISTENT_KEY,
  ODL_WALLET_PROVIDER_SESSION_KEY,
} from './wallet-facade.client';
import { ODL_HS_TOKEN_STORAGE_KEY } from './hivesigner-token.constants';

describe('clearWalletSession', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearHasAuthSession();
    setActiveProvider.mockReset();
  });

  it('clears HAS session and wallet provider markers', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'key',
      expire: Date.now() + 60_000,
    });
    localStorage.setItem(ODL_KEYCHAIN_PERSISTENT_KEY, '1');
    localStorage.setItem(ODL_WALLET_PROVIDER_SESSION_KEY, 'hivesigner');
    localStorage.setItem(ODL_HS_TOKEN_STORAGE_KEY, 'hs-token');
    sessionStorage.setItem(ODL_WALLET_PROVIDER_SESSION_KEY, 'hivesigner');

    clearWalletSession();

    expect(localStorage.getItem(ODL_HIVEAUTH_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(ODL_HIVEAUTH_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(ODL_KEYCHAIN_PERSISTENT_KEY)).toBeNull();
    expect(localStorage.getItem(ODL_WALLET_PROVIDER_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(ODL_HS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(setActiveProvider).toHaveBeenCalledWith(null);
  });
});
