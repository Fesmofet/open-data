import { getWalletFacade } from '@/modules/auth';

/** Memo encrypt/decrypt via Keychain is only available when logged in with Keychain. */
export function canUseKeychainMemoCrypto(): boolean {
  return getWalletFacade().getActiveProvider() === 'keychain';
}
