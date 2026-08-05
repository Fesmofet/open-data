/** @jest-environment jsdom */

jest.mock('./providers/has/has-client', () => ({
  authenticateWithHas: jest.fn(),
  broadcastWithHas: jest.fn(),
  ensureHasConnection: jest.fn(),
  getActiveHasWsUrl: jest.fn(),
}));

import {
  clearHasAuthSession,
  saveHasAuthSession,
} from './providers/has/has-auth-session.storage';
import {
  resolveBroadcastProvider,
  shouldFallbackKeychainBroadcastToHas,
  shouldTryKeychainBeforeHas,
} from './resolve-broadcast-provider';

describe('resolveBroadcastProvider', () => {
  beforeEach(() => {
    clearHasAuthSession();
  });

  it('prefers hiveauth when a valid HAS session exists', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
      host: 'wss://hive-auth.arcange.eu',
    });
    expect(resolveBroadcastProvider('keychain')).toBe('hiveauth');
  });

  it('falls back to active provider when HAS session is expired', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() - 60_000,
    });
    expect(resolveBroadcastProvider('keychain')).toBe('keychain');
  });

  it('falls back to the active provider without HAS session', () => {
    expect(resolveBroadcastProvider('keychain')).toBe('keychain');
  });

  it('throws when not logged in and HAS session is missing', () => {
    expect(() => resolveBroadcastProvider(null)).toThrow('Not logged in');
  });
});

describe('legacy broadcast helpers', () => {
  beforeEach(() => {
    clearHasAuthSession();
  });

  it('falls back to HAS only for connected-through-HAS errors', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
    });
    expect(shouldFallbackKeychainBroadcastToHas(new Error('connected through HAS'))).toBe(
      true,
    );
  });

  it('does not fall back on user cancel', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
    });
    expect(shouldFallbackKeychainBroadcastToHas(new Error('User rejected'))).toBe(false);
  });

  it('does not fall back without valid HAS session', () => {
    expect(shouldFallbackKeychainBroadcastToHas(new Error('connected through HAS'))).toBe(
      false,
    );
  });

  it('does not fall back with expired HAS session', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() - 60_000,
    });
    expect(shouldFallbackKeychainBroadcastToHas(new Error('connected through HAS'))).toBe(
      false,
    );
  });

  it('does not try keychain before HAS on mobile user agents', () => {
    const originalUa = navigator.userAgent;
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    expect(shouldTryKeychainBeforeHas()).toBe(false);
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUa,
    });
  });

  it('tries keychain before HAS on desktop when hive_keychain is injected', () => {
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    expect(shouldTryKeychainBeforeHas()).toBe(true);
  });
});
