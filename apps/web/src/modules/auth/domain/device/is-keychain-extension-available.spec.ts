/** @jest-environment jsdom */

import { isKeychainExtensionAvailable } from './is-keychain-extension-available';

describe('isKeychainExtensionAvailable', () => {
  afterEach(() => {
    delete (window as Window & { hive_keychain?: unknown }).hive_keychain;
  });

  it('returns false when hive_keychain is missing', () => {
    expect(isKeychainExtensionAvailable()).toBe(false);
  });

  it('returns false when requestSignBuffer is missing', () => {
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      {};
    expect(isKeychainExtensionAvailable()).toBe(false);
  });

  it('returns true when requestSignBuffer is a function', () => {
    (window as Window & { hive_keychain?: { requestSignBuffer?: unknown } }).hive_keychain =
      { requestSignBuffer: () => undefined };
    expect(isKeychainExtensionAvailable()).toBe(true);
  });
});
