import CryptoJS from 'crypto-js';

export function encryptHasPayload(payload: unknown, authKey: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), authKey).toString();
}

export function decryptHasPayload<T>(ciphertext: string, authKey: string): T {
  const decrypted = CryptoJS.AES.decrypt(ciphertext, authKey).toString(
    CryptoJS.enc.Utf8,
  );
  if (!decrypted) {
    throw new Error('Failed to decrypt HAS payload');
  }
  return JSON.parse(decrypted) as T;
}

export function decryptHasError(ciphertext: string, authKey: string): string {
  return CryptoJS.AES.decrypt(ciphertext, authKey).toString(CryptoJS.enc.Utf8);
}
