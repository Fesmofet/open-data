import type { WalletMainAsset } from './wallet-modal-types';

export type PowerModalMode = 'up' | 'down';

export function getWalletPowerReceiveSuffix(asset: WalletMainAsset): string {
  return `${asset} Power`;
}

/** Asset label on the amount row (power down shows staked / power form). */
export function getWalletPowerAmountAssetLabel(
  asset: WalletMainAsset,
  mode: PowerModalMode,
): string {
  if (mode === 'up') {
    return asset;
  }
  return getWalletPowerReceiveSuffix(asset);
}

export function getWalletPowerDownBalanceSymbol(
  asset: WalletMainAsset,
  mode: PowerModalMode,
): string {
  if (mode === 'up') {
    return asset;
  }
  return getWalletPowerReceiveSuffix(asset);
}

export function getWalletPowerDownLiquidSymbol(asset: WalletMainAsset): string {
  if (asset === 'HIVE') {
    return 'HIVE';
  }
  return asset;
}

/** Delegate modal asset selector and balance symbol (WP / HP). */
export function getWalletDelegateAmountAssetLabel(asset: WalletMainAsset): string {
  if (asset === 'WAIV') {
    return 'WP';
  }
  if (asset === 'HIVE') {
    return 'HP';
  }
  return asset;
}

/** Manage-delegations asset selector label (WAIV Power (WP) / HIVE Power (HP)). */
export function getWalletManageDelegationsAssetLabel(
  asset: WalletMainAsset,
  translate: (key: string) => string,
): string {
  if (asset === 'WAIV') {
    return `${translate('wallet_waiv_power')} (WP)`;
  }
  if (asset === 'HIVE') {
    return `${translate('wallet_hive_power')} (HP)`;
  }
  return asset;
}
