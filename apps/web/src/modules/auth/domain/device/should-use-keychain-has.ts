import { isKeychainExtensionAvailable } from './is-keychain-extension-available';
import { isMobileBrowser } from './is-mobile-browser';

/**
 * Use HiveAuth (HAS) when the injected `hive_keychain` API is unavailable.
 * Mobile Safari/Chrome (incl. private mode) → HAS QR/deep link.
 * Keychain Mobile in-app browser injects `hive_keychain` → use it directly (legacy Waivio).
 */
export function shouldUseKeychainHas(): boolean {
  if (isMobileBrowser() && isKeychainExtensionAvailable()) {
    return false;
  }
  return !isKeychainExtensionAvailable();
}
