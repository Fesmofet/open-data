export type WalletMainAsset = 'WAIV' | 'HIVE';

export type WalletTransferAsset = WalletMainAsset | 'HBD';

export type WalletTransferModalState = {
  kind: 'transfer';
  asset: WalletTransferAsset;
  toSavings?: boolean;
  fromSavings?: boolean;
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

export type WalletModalState =
  | WalletTransferModalState
  | WalletPowerModalState
  | WalletDelegateModalState
  | WalletManageDelegationsModalState
  | WalletCancelPowerDownModalState
  | WalletDelegateRcModalState
  | WalletManageRcModalState
  | WalletCancelSavingsWithdrawModalState
  | null;
