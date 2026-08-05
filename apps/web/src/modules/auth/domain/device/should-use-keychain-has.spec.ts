/** @jest-environment jsdom */

import { shouldUseKeychainHas } from './should-use-keychain-has';

describe('shouldUseKeychainHas', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    delete (window as Window & { hive_keychain?: unknown }).hive_keychain;
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it('returns true when the Keychain API is unavailable', () => {
    expect(shouldUseKeychainHas()).toBe(true);
  });

  it('returns true on mobile Safari without hive_keychain', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    expect(shouldUseKeychainHas()).toBe(true);
  });

  it('returns false on mobile when Keychain in-app browser injects hive_keychain', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    expect(shouldUseKeychainHas()).toBe(false);
  });

  it('returns false on desktop when extension is available', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    expect(shouldUseKeychainHas()).toBe(false);
  });
});
