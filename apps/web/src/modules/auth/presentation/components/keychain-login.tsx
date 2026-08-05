'use client';

import { useCallback, useState } from 'react';

import { useHasConfig } from '@/config/has-config-provider';

import { createHiveAuthVerifyUseCase } from '../../application';
import { pushAccountHistory } from '../../domain/account-history';
import { shouldUseKeychainHas } from '../../domain/device/should-use-keychain-has';
import { createAuthBffClient } from '../../infrastructure/clients/auth-bff.client';
import {
  authenticateWithHas,
  clearHasAuthSession,
  saveHasAuthSession,
} from '../../infrastructure/providers/has';
import { buildHiveAuthVerifyPayload } from '../../infrastructure/providers/hiveauth-provider';
import {
  getWalletFacade,
  ODL_KEYCHAIN_PERSISTENT_KEY,
} from '../../infrastructure/wallet-facade.client';

const bff = createAuthBffClient();
const verifyHiveAuth = createHiveAuthVerifyUseCase(bff);

export type KeychainLoginMode = 'form' | 'has-waiting';

export type UseKeychainLoginOptions = {
  onLoginSuccess?: () => void;
};

export function useKeychainLogin({ onLoginSuccess }: UseKeychainLoginOptions = {}) {
  const hasConfig = useHasConfig();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<KeychainLoginMode>('form');
  const [hasDeepLink, setHasDeepLink] = useState<string | null>(null);
  const [hasExpiresAtMs, setHasExpiresAtMs] = useState<number | null>(null);

  const cancelHas = useCallback(() => {
    setMode('form');
    setHasDeepLink(null);
    setHasExpiresAtMs(null);
    setPending(false);
    setError(null);
  }, []);

  const signInWithExtension = useCallback(
    async (username: string) => {
      clearHasAuthSession();
      await getWalletFacade().login('keychain', username);
      try {
        localStorage.setItem(ODL_KEYCHAIN_PERSISTENT_KEY, '1');
      } catch {
        // ignore quota / private mode
      }
      getWalletFacade().setActiveProvider('keychain');
      pushAccountHistory(username);
      onLoginSuccess?.();
    },
    [onLoginSuccess],
  );

  const signInWithHas = useCallback(
    async (username: string) => {
      clearHasAuthSession();
      const trimmed = username.trim().replace(/^@/, '').toLowerCase();
      const ch = await bff.challenge({ provider: 'hiveauth', username: trimmed });

      setMode('has-waiting');
      setHasDeepLink(null);
      setHasExpiresAtMs(new Date(ch.expiresAt).getTime());

      const session = await authenticateWithHas({
        username: trimmed,
        challengeMessage: ch.message,
        config: hasConfig,
        onAuthWait: (evt) => {
          setHasDeepLink(evt.deepLink);
          setHasExpiresAtMs(evt.expire);
        },
      });

      saveHasAuthSession(session);

      const authData = buildHiveAuthVerifyPayload({
        username: trimmed,
        expireMs: session.expire,
        challengeMessage: ch.message,
      });

      try {
        await verifyHiveAuth({
          challengeId: ch.challengeId,
          username: trimmed,
          authData,
        });
      } catch (err) {
        clearHasAuthSession();
        throw err;
      }

      try {
        localStorage.removeItem(ODL_KEYCHAIN_PERSISTENT_KEY);
      } catch {
        // ignore quota / private mode
      }
      getWalletFacade().setActiveProvider('hiveauth');
      pushAccountHistory(trimmed);
      setMode('form');
      setHasDeepLink(null);
      setHasExpiresAtMs(null);
      onLoginSuccess?.();
    },
    [hasConfig, onLoginSuccess],
  );

  const signIn = useCallback(
    async (username: string) => {
      const trimmed = username.trim();
      if (!trimmed) {
        return;
      }
      setError(null);
      setPending(true);
      try {
        if (shouldUseKeychainHas()) {
          await signInWithHas(trimmed);
        } else {
          await signInWithExtension(trimmed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
        if (shouldUseKeychainHas()) {
          setMode('form');
          setHasDeepLink(null);
          setHasExpiresAtMs(null);
        }
      } finally {
        setPending(false);
      }
    },
    [signInWithExtension, signInWithHas],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    signIn,
    error,
    pending,
    clearError,
    mode,
    hasDeepLink,
    hasExpiresAtMs,
    cancelHas,
  };
}
