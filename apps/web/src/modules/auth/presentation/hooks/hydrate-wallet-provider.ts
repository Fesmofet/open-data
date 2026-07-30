import {
  getHivesignerToken,
  hydrateHivesignerTokenFromCookie,
} from '../../infrastructure/hivesigner-token';
import {
  getWalletFacade,
  ODL_KEYCHAIN_PERSISTENT_KEY,
  ODL_WALLET_PROVIDER_SESSION_KEY,
} from '../../infrastructure/wallet-facade.client';

/**
 * Restores `DefaultWalletFacade.activeProvider` from cookie/localStorage markers.
 * Safe to call synchronously before broadcast (e.g. notification settings save).
 */
export function hydrateWalletProviderFromStorage(): void {
  if (hydrateHivesignerTokenFromCookie()) {
    getWalletFacade().setActiveProvider('hivesigner');
    return;
  }

  try {
    if (localStorage.getItem(ODL_KEYCHAIN_PERSISTENT_KEY)) {
      getWalletFacade().setActiveProvider('keychain');
      return;
    }
  } catch {
    // ignore private mode / storage errors
  }

  try {
    const raw = localStorage.getItem(ODL_WALLET_PROVIDER_SESSION_KEY);
    if (raw === 'hivesigner' && getHivesignerToken()) {
      getWalletFacade().setActiveProvider('hivesigner');
      return;
    }
  } catch {
    // ignore private mode / storage errors
  }

  try {
    const legacy = sessionStorage.getItem(ODL_WALLET_PROVIDER_SESSION_KEY);
    if (legacy === 'keychain') {
      localStorage.setItem(ODL_KEYCHAIN_PERSISTENT_KEY, '1');
      sessionStorage.removeItem(ODL_WALLET_PROVIDER_SESSION_KEY);
      getWalletFacade().setActiveProvider('keychain');
    }
  } catch {
    // ignore storage errors
  }
}
