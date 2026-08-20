'use client';

import { normalizeHiveMemoCiphertext } from '@opden-data-layer/hive-memo-crypto';

import type { HiveKeychainWindow } from '@/modules/auth/infrastructure/providers/keychain-provider';

import { canUseKeychainMemoCrypto } from '../infrastructure/memo-crypto-capability';

type KeychainMemoResponse = {
  success: boolean;
  error?: string;
  result?: unknown;
};

export const KEYCHAIN_MEMO_PROBE_TIMEOUT_MS = 5000;

function hiveAccount(name: string): string {
  return name.trim().toLowerCase();
}

function memoPlaintextForKeychain(plaintext: string): string {
  const trimmed = plaintext.trim();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function extractMemoTextFromKeychainResult(result: unknown): string | null {
  if (typeof result === 'string') {
    const trimmed = result.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>;
    for (const key of ['message', 'encoded', 'memo', 'result', 'data']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return null;
}

function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => resolve(fallback), timeoutMs);
    void promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timeoutId);
        resolve(fallback);
      });
  });
}

async function probeKeychainMemoKeyImpl(username: string): Promise<boolean> {
  const kc = (window as HiveKeychainWindow).hive_keychain;
  if (!kc?.requestSignBuffer) {
    return false;
  }
  return new Promise((resolve) => {
    kc.requestSignBuffer(hiveAccount(username), 'odl-memo-probe', 'Memo', (response) => {
      resolve(Boolean(response.success));
    });
  });
}

export async function probeKeychainMemoKey(username: string): Promise<boolean> {
  if (!canUseKeychainMemoCrypto()) {
    return false;
  }
  return promiseWithTimeout(
    probeKeychainMemoKeyImpl(username),
    KEYCHAIN_MEMO_PROBE_TIMEOUT_MS,
    false,
  );
}

export async function encodeMessageWithKeychain(
  sender: string,
  receiver: string,
  plaintext: string,
): Promise<string> {
  if (!canUseKeychainMemoCrypto()) {
    throw new Error('Keychain memo encrypt requires Keychain login');
  }
  const kc = (window as HiveKeychainWindow).hive_keychain;
  const requestEncodeMessage = kc?.requestEncodeMessage;
  if (!requestEncodeMessage) {
    throw new Error('Keychain encode not available');
  }
  return new Promise((resolve, reject) => {
    requestEncodeMessage(
      hiveAccount(sender),
      hiveAccount(receiver),
      memoPlaintextForKeychain(plaintext),
      'Memo',
      (response: KeychainMemoResponse) => {
        if (!response.success) {
          reject(new Error(response.error ?? 'Encode failed'));
          return;
        }
        const encoded = extractMemoTextFromKeychainResult(response.result);
        if (!encoded) {
          reject(new Error('Keychain returned empty ciphertext'));
          return;
        }
        resolve(normalizeHiveMemoCiphertext(encoded));
      },
    );
  });
}

export async function decodeMessageWithKeychain(
  viewer: string,
  ciphertext: string,
): Promise<string> {
  if (!canUseKeychainMemoCrypto()) {
    throw new Error('Keychain memo decrypt requires Keychain login');
  }
  const kc = (window as HiveKeychainWindow).hive_keychain;
  const requestVerifyKey = kc?.requestVerifyKey;
  if (!requestVerifyKey) {
    throw new Error('Keychain decode not available');
  }
  return new Promise((resolve, reject) => {
    requestVerifyKey(
      hiveAccount(viewer),
      normalizeHiveMemoCiphertext(ciphertext),
      'Memo',
      (response: KeychainMemoResponse) => {
        if (!response.success) {
          reject(new Error(response.error ?? 'Decode failed'));
          return;
        }
        const decoded = extractMemoTextFromKeychainResult(response.result);
        if (!decoded) {
          reject(new Error('Keychain returned empty plaintext'));
          return;
        }
        resolve(decoded.startsWith('#') ? decoded.slice(1) : decoded);
      },
    );
  });
}
