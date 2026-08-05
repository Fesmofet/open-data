import type { WalletProviderMeta } from './types';

export const WALLET_PROVIDERS: WalletProviderMeta[] = [
  {
    id: 'keychain',
    displayName: 'Hive Keychain',
    iconSrc: '/images/icons/keychain-logo.png',
    category: 'extension',
    isCustodial: false,
  },
  {
    // Internal-only: mobile HAS login + broadcast; not shown as a separate login row.
    id: 'hiveauth',
    displayName: 'HiveAuth',
    iconSrc: '/images/icons/hive-auth-logo.png',
    category: 'mobile',
    isCustodial: false,
  },
  {
    id: 'hivesigner',
    displayName: 'HiveSigner',
    iconSrc: '/images/icons/hivesigner-logo.png',
    category: 'web',
    isCustodial: true,
  },
];
