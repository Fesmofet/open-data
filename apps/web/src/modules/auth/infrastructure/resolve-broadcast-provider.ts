import type { WalletProviderId } from '../domain/types';
import { isKeychainExtensionAvailable } from '../domain/device/is-keychain-extension-available';
import { isMobileBrowser } from '../domain/device/is-mobile-browser';
import {
  getHasAuthSession,
  isHasAuthSessionValid,
} from './providers/has';

/** Prefer HiveAuth when a valid HAS session exists (legacy Cookie `auth`). */
export function resolveBroadcastProvider(
  activeProvider: WalletProviderId | null,
): WalletProviderId {
  const session = getHasAuthSession();
  if (isHasAuthSessionValid(session)) {
    return 'hiveauth';
  }
  if (!activeProvider) {
    throw new Error('Not logged in');
  }
  return activeProvider;
}

/**
 * Legacy steemConnectAPI: try injected Keychain before HAS on desktop.
 * Mobile Safari/Chrome (no real extension) must use HAS.broadcast directly.
 */
export function shouldTryKeychainBeforeHas(): boolean {
  if (isMobileBrowser()) {
    return false;
  }
  return isKeychainExtensionAvailable();
}

const HAS_KEYCHAIN_FALLBACK_PATTERN = /connected through has/i;
const KEYCHAIN_USER_CANCEL_PATTERN = /user rejected|cancel/i;

export function shouldFallbackKeychainBroadcastToHas(error: unknown): boolean {
  const session = getHasAuthSession();
  if (!isHasAuthSessionValid(session)) {
    return false;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  if (KEYCHAIN_USER_CANCEL_PATTERN.test(error.message)) {
    return false;
  }
  return HAS_KEYCHAIN_FALLBACK_PATTERN.test(error.message);
}
