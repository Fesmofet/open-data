import { Memo, PrivateKey } from '@hiveio/dhive';

import type { EncryptionMode } from './types';

function stripMemoPrefix(decoded: string): string {
  return decoded.startsWith('#') ? decoded.slice(1) : decoded;
}

function encodePlaintext(plaintext: string): string {
  return plaintext.startsWith('#') ? plaintext : `#${plaintext}`;
}

/**
 * Encrypt with sender memo private key + recipient memo public key (bidirectional).
 */
export function encryptWithMemoPrivateKey(
  senderMemoPrivate: string | PrivateKey,
  recipientMemoPublic: string,
  plaintext: string,
): string {
  return Memo.encode(senderMemoPrivate, recipientMemoPublic, encodePlaintext(plaintext));
}

function seedToHex(seed: Uint8Array): string {
  return Array.from(seed, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * One-way encrypt: ephemeral key is discarded; only recipient can decrypt.
 */
export function encryptEphemeralOneWay(
  recipientMemoPublic: string,
  plaintext: string,
): string {
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const ephemeral = PrivateKey.fromSeed(seedToHex(seed));
  return Memo.encode(ephemeral, recipientMemoPublic, encodePlaintext(plaintext));
}

export function decryptWithMemoPrivateKey(
  recipientMemoPrivate: string | PrivateKey,
  ciphertext: string,
): string {
  const decoded = Memo.decode(recipientMemoPrivate, ciphertext);
  return stripMemoPrefix(decoded);
}

export function createMemoCryptoOperations(): {
  encryptForRecipient(input: {
    senderMemoPrivateWif?: string;
    recipientMemoPublic: string;
    plaintext: string;
    mode: EncryptionMode;
  }): Promise<{ ciphertext: string; mode: EncryptionMode }>;
  decrypt(input: {
    recipientMemoPrivateWif: string;
    ciphertext: string;
  }): string;
} {
  return {
    async encryptForRecipient(input) {
      if (input.mode === 'ephemeral') {
        return {
          ciphertext: encryptEphemeralOneWay(input.recipientMemoPublic, input.plaintext),
          mode: 'ephemeral',
        };
      }
      if (!input.senderMemoPrivateWif) {
        throw new Error('senderMemoPrivateWif is required for memo mode');
      }
      return {
        ciphertext: encryptWithMemoPrivateKey(
          input.senderMemoPrivateWif,
          input.recipientMemoPublic,
          input.plaintext,
        ),
        mode: 'memo',
      };
    },
    decrypt(input) {
      return decryptWithMemoPrivateKey(input.recipientMemoPrivateWif, input.ciphertext);
    },
  };
}

/** Demo keypair for tests only. */
export function demoMemoKeyPair(seed: string): {
  privateWif: string;
  publicMemo: string;
} {
  const privateKey = PrivateKey.fromSeed(seed);
  return {
    privateWif: privateKey.toString(),
    publicMemo: privateKey.createPublic().toString(),
  };
}
