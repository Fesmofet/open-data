import type { WalletMainAsset } from './wallet-modal-types';

export type PowerModalMode = 'up' | 'down';

export function getWalletPowerAssetSelectLabel(
  asset: WalletMainAsset,
  mode: PowerModalMode,
  labels: {
    waivPower: string;
    hivePower: string;
  },
): string {
  if (mode === 'up') {
    return asset;
  }
  if (asset === 'WAIV') {
    return labels.waivPower;
  }
  if (asset === 'HIVE') {
    return labels.hivePower;
  }
  return asset;
}

export function getWalletPowerReceiveSuffix(
  asset: WalletMainAsset,
  labels: {
    waivPower: string;
    hivePower: string;
  },
): string {
  if (asset === 'WAIV') {
    return labels.waivPower;
  }
  if (asset === 'HIVE') {
    return labels.hivePower;
  }
  return asset;
}

export function getWalletPowerDownLiquidSymbol(asset: WalletMainAsset): string {
  if (asset === 'HIVE') {
    return 'HIVE';
  }
  return asset;
}
