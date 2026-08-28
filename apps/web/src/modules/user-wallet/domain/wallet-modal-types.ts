import type { HivePendingRewardsView } from './types/hive-wallet-view';

export const HIVE_L1_TRANSFER_ASSETS = ['HIVE', 'HBD'] as const;

export type HiveL1TransferAsset = (typeof HIVE_L1_TRANSFER_ASSETS)[number];

export type WalletTransferAsset = string;

export type WalletMainAsset = string;

export function isHiveL1TransferAsset(
  asset: string,
): asset is HiveL1TransferAsset {
  return asset === 'HIVE' || asset === 'HBD';
}

export function isEngineTokenAsset(asset: string): boolean {
  return !isHiveL1TransferAsset(asset);
}

export type WalletTransferModalState = {
  kind: 'transfer';
  asset: WalletTransferAsset;
  toSavings?: boolean;
  fromSavings?: boolean;
  /** Pre-filled Hive recipient (e.g. engine deposit routing). */
  presetTo?: string;
  /** Pre-filled transfer memo (e.g. hivepegged buy JSON). */
  presetMemo?: string;
  /** Lock asset selector when routing is token-specific. */
  lockAsset?: boolean;
  /** Lock recipient field when deposit routing is fixed. */
  lockRecipient?: boolean;
};

export type WalletPowerModalState = {
  kind: 'power';
  mode: 'up' | 'down';
  asset: WalletMainAsset;
};

export type WalletDelegateModalState = {
  kind: 'delegate';
  asset: WalletMainAsset;
};

export type WalletManageDelegationsModalState = {
  kind: 'manage';
  asset: WalletMainAsset;
};

export type WalletCancelPowerDownModalState = {
  kind: 'cancelPowerDown';
  asset: WalletMainAsset;
};

export type WalletDelegateRcModalState = {
  kind: 'delegateRc';
};

export type WalletManageRcModalState = {
  kind: 'manageRc';
};

export type WalletCancelSavingsWithdrawModalState = {
  kind: 'cancelSavingsWithdraw';
  requestId: number;
  amount: string;
  asset: 'HIVE' | 'HBD';
};

export type WalletSwapModalState = {
  kind: 'swap';
  fromSymbol?: string;
  toSymbol?: string;
};

export type WalletDepositModalState = {
  kind: 'deposit';
};

export type WalletWithdrawModalState = {
  kind: 'withdraw';
  inputSymbol?: string;
  outputSymbol?: string;
};

export type WalletClaimRewardsModalState = {
  kind: 'claimRewards';
  pendingRewards: HivePendingRewardsView;
};

export type WalletConvertHbdModalState = {
  kind: 'convertHbd';
};

export type WalletHiveChangellyWithdrawModalState = {
  kind: 'hiveChangellyWithdraw';
  outputCoinType: 'btc' | 'ltc' | 'eth';
};

export type WalletModalState =
  | WalletTransferModalState
  | WalletPowerModalState
  | WalletDelegateModalState
  | WalletManageDelegationsModalState
  | WalletCancelPowerDownModalState
  | WalletDelegateRcModalState
  | WalletManageRcModalState
  | WalletCancelSavingsWithdrawModalState
  | WalletSwapModalState
  | WalletDepositModalState
  | WalletWithdrawModalState
  | WalletClaimRewardsModalState
  | WalletConvertHbdModalState
  | WalletHiveChangellyWithdrawModalState
  | null;
