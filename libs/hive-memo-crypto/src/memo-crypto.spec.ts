import {
  decryptWithMemoPrivateKey,
  demoMemoKeyPair,
  encryptEphemeralOneWay,
  encryptWithMemoPrivateKey,
} from './memo-crypto';
import { isHiveMemoCiphertext } from './types';

describe('hive-memo-crypto', () => {
  const message = 'hello encrypted world';

  it('memo roundtrip decrypts to original plaintext', () => {
    const alice = demoMemoKeyPair('alice-memo-test');
    const bob = demoMemoKeyPair('bob-memo-test');
    const ciphertext = encryptWithMemoPrivateKey(
      alice.privateWif,
      bob.publicMemo,
      message,
    );
    expect(isHiveMemoCiphertext(ciphertext)).toBe(true);
    expect(decryptWithMemoPrivateKey(bob.privateWif, ciphertext)).toBe(message);
  });

  it('ephemeral one-way: recipient decrypts, sender cannot', () => {
    const alice = demoMemoKeyPair('alice-ephemeral-test');
    const bob = demoMemoKeyPair('bob-ephemeral-test');
    const ciphertext = encryptEphemeralOneWay(bob.publicMemo, message);
    expect(decryptWithMemoPrivateKey(bob.privateWif, ciphertext)).toBe(message);
    expect(() => decryptWithMemoPrivateKey(alice.privateWif, ciphertext)).toThrow();
  });

  it('isHiveMemoCiphertext rejects invalid strings', () => {
    expect(isHiveMemoCiphertext('hello')).toBe(false);
    expect(isHiveMemoCiphertext('#O0Il')).toBe(false);
    expect(isHiveMemoCiphertext('')).toBe(false);
  });

  it('isHiveMemoCiphertext accepts base58 without leading hash', () => {
    expect(isHiveMemoCiphertext('5HQ7GhTabcdefghJKMNPQRSTUVWxyz')).toBe(true);
  });
});
