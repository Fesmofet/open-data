'use client';

import type { ReactNode } from 'react';

import { useHydrateWalletProvider } from '@/modules/auth';

import { HiveCancelSavingsWithdrawModal } from '../hive-wallet/hive-cancel-savings-withdraw-modal';
import { HiveDelegateRcModal } from '../hive-wallet/hive-delegate-rc-modal';
import { HiveManageRcDelegationsModal } from '../hive-wallet/hive-manage-rc-delegations-modal';
import { WalletCancelPowerDownModal } from './wallet-cancel-power-down-modal';
import { WalletDelegateModal } from './wallet-delegate-modal';
import { WalletDepositModal } from './wallet-deposit-modal';
import { WalletManageDelegationsModal } from './wallet-manage-delegations-modal';
import { WalletModalProvider, useWalletModal } from './wallet-modal-context';
import { WalletPowerModal } from './wallet-power-modal';
import { WalletSwapModal } from './wallet-swap-modal';
import { WalletTransferModal } from './wallet-transfer-modal';
import { WalletWithdrawModal } from './wallet-withdraw-modal';
import { WalletBalancesProvider } from './wallet-balances-context';

import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import type { WalletModalState } from '../../../domain/wallet-modal-types';

function WalletModals({
  account,
  modal,
  closeModal,
}: {
  account: string;
  modal: Exclude<WalletModalState, null>;
  closeModal: () => void;
}) {
  switch (modal.kind) {
    case 'transfer':
      return (
        <WalletTransferModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'power':
      return (
        <WalletPowerModal open onClose={closeModal} account={account} state={modal} />
      );
    case 'delegate':
      return (
        <WalletDelegateModal open onClose={closeModal} account={account} state={modal} />
      );
    case 'manage':
      return (
        <WalletManageDelegationsModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'cancelPowerDown':
      return (
        <WalletCancelPowerDownModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'delegateRc':
      return <HiveDelegateRcModal open onClose={closeModal} account={account} />;
    case 'manageRc':
      return (
        <HiveManageRcDelegationsModal open onClose={closeModal} account={account} />
      );
    case 'cancelSavingsWithdraw':
      return (
        <HiveCancelSavingsWithdrawModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'swap':
      return (
        <WalletSwapModal open onClose={closeModal} account={account} state={modal} />
      );
    case 'deposit':
      return (
        <WalletDepositModal open onClose={closeModal} account={account} state={modal} />
      );
    case 'withdraw':
      return (
        <WalletWithdrawModal open onClose={closeModal} account={account} state={modal} />
      );
    default:
      return null;
  }
}

export function WalletModalsGate({ account }: { account: string }) {
  const { modal, closeModal } = useWalletModal();
  if (!modal) {
    return null;
  }
  return <WalletModals account={account} modal={modal} closeModal={closeModal} />;
}

/** Legacy host for non-transfers wallet surfaces; transfers use TransfersWalletPageClient. */
export type UnifiedWalletModalHostProps = {
  account: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  engineSummary?: EngineWalletSummaryView | null;
  children: ReactNode;
  hideInlineModals?: boolean;
};

export function UnifiedWalletModalHostInner({
  account,
  viewerUsername,
  waivSummary,
  hiveSummary,
  engineSummary = null,
  children,
  hideInlineModals = false,
}: UnifiedWalletModalHostProps) {
  useHydrateWalletProvider();
  const canManage =
    viewerUsername?.trim().toLowerCase() === account.trim().toLowerCase();

  return (
    <WalletBalancesProvider
      waivSummary={waivSummary}
      hiveSummary={hiveSummary}
      engineSummary={engineSummary}
    >
      {children}
      {canManage && !hideInlineModals ? <WalletModalsGate account={account} /> : null}
    </WalletBalancesProvider>
  );
}

export function UnifiedWalletModalHost(props: UnifiedWalletModalHostProps) {
  return (
    <WalletModalProvider>
      <UnifiedWalletModalHostInner {...props} />
    </WalletModalProvider>
  );
}
