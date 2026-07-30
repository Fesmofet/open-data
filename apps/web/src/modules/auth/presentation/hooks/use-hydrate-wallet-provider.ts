'use client';

import { useEffect } from 'react';

import { hydrateWalletProviderFromStorage } from './hydrate-wallet-provider';

/**
 * After a full reload, cookie session is valid but `DefaultWalletFacade` loses `activeProvider`.
 * Both Keychain and HiveSigner state is persisted in `localStorage` so the provider survives
 * browser restarts while the refresh cookie (7 days) is still valid.
 *
 * - Keychain: `ODL_KEYCHAIN_PERSISTENT_KEY` in localStorage (no sensitive token in our code).
 * - HiveSigner: token + provider marker in localStorage; also restored from the short-lived
 *   handoff cookie written by the BFF OAuth callback.
 * - Legacy: old `sessionStorage['odl_wallet_provider'] = 'keychain'` entries are migrated
 *   to localStorage on first mount so existing sessions are not disrupted.
 */
export function useHydrateWalletProvider(): void {
  useEffect(() => {
    hydrateWalletProviderFromStorage();
  }, []);
}
