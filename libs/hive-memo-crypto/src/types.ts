/** Hive memo ciphertext: `#` + base58 (no 0,O,I,l). */
export const HIVE_MEMO_CIPHERTEXT_REGEX = /^#[1-9A-HJ-NP-Za-km-z]+$/;

export const ENCRYPTION_MODES = ['memo', 'ephemeral'] as const;
export type EncryptionMode = (typeof ENCRYPTION_MODES)[number];

export const ENCRYPTION_VERSION = 1 as const;

export function normalizeHiveMemoCiphertext(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function isHiveMemoCiphertext(value: string): boolean {
  return HIVE_MEMO_CIPHERTEXT_REGEX.test(normalizeHiveMemoCiphertext(value));
}

export interface MemoCryptoOperations {
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
}
