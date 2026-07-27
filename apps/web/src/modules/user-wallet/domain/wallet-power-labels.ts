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
