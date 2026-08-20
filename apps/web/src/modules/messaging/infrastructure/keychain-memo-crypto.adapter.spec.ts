/** @jest-environment jsdom */

const getActiveProvider = jest.fn();

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    getActiveProvider,
  }),
}));

import {
  decodeMessageWithKeychain,
  encodeMessageWithKeychain,
} from './keychain-memo-crypto.adapter';

type KeychainCallback = (response: { success: boolean; error?: string; result?: unknown }) => void;

/**
 * Mirrors the real Keychain extension: request methods call sibling members through
 * `this`, so a detached function reference throws `this.dispatchCustomEvent is not a function`.
 */
function createKeychainStub() {
  return {
    dispatchCustomEvent(_name: string, payload: unknown, callback: KeychainCallback) {
      callback({ success: true, result: payload });
    },
    requestEncodeMessage(
      _username: string,
      _receiver: string,
      message: string,
      _keyType: string,
      callback: KeychainCallback,
    ) {
      this.dispatchCustomEvent('encode', `#encoded${message}`, callback);
    },
    requestVerifyKey(
      _username: string,
      _encryptedMessage: string,
      _keyType: string,
      callback: KeychainCallback,
    ) {
      this.dispatchCustomEvent('verify', '#decoded', callback);
    },
  };
}

function installKeychain(stub: unknown): void {
  (window as Window & { hive_keychain?: unknown }).hive_keychain = stub;
}

describe('keychain memo crypto adapter', () => {
  beforeEach(() => {
    getActiveProvider.mockReturnValue('keychain');
    installKeychain(createKeychainStub());
  });

  afterEach(() => {
    delete (window as Window & { hive_keychain?: unknown }).hive_keychain;
  });

  it('encodes without losing the Keychain `this` binding', async () => {
    await expect(encodeMessageWithKeychain('Alice', 'Bob', 'hello')).resolves.toBe(
      '#encoded#hello',
    );
  });

  it('decodes without losing the Keychain `this` binding', async () => {
    await expect(decodeMessageWithKeychain('Alice', '#cipher')).resolves.toBe('decoded');
  });

  it('rejects when the provider is not keychain', async () => {
    getActiveProvider.mockReturnValue('hivesigner');
    await expect(encodeMessageWithKeychain('alice', 'bob', 'hello')).rejects.toThrow(
      'Keychain memo encrypt requires Keychain login',
    );
  });

  it('rejects when Keychain does not expose the memo methods', async () => {
    installKeychain({});
    await expect(encodeMessageWithKeychain('alice', 'bob', 'hello')).rejects.toThrow(
      'Keychain encode not available',
    );
    await expect(decodeMessageWithKeychain('alice', '#cipher')).rejects.toThrow(
      'Keychain decode not available',
    );
  });
});
