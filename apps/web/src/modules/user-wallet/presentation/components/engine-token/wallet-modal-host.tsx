'use client';

import type { ReactNode } from 'react';

import { useHydrateWalletProvider } from '@/modules/auth';

import { EngineTokenCancelPowerDownModal } from './engine-token-cancel-power-down-modal';
import { EngineTokenDelegateModal } from './engine-token-delegate-modal';
import { EngineTokenManageDelegationsModal } from './engine-token-manage-delegations-modal';
import {
  EngineTokenModalProvider,
  useEngineTokenModal,
} from './engine-token-modal-context';
import { EngineTokenPowerModal } from './engine-token-power-modal';
import { EngineTokenTransferModal } from './engine-token-transfer-modal';

function EngineTokenModals({ account }: { account: string }) {
  const { modal, closeModal } = useEngineTokenModal();
  if (!modal) {
    return null;
  }
  switch (modal.kind) {
    case 'power':
      return (
        <EngineTokenPowerModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'transfer':
      return (
        <EngineTokenTransferModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'delegate':
      return (
        <EngineTokenDelegateModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'manage':
      return (
        <EngineTokenManageDelegationsModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    case 'cancelPowerDown':
      return (
        <EngineTokenCancelPowerDownModal
          open
          onClose={closeModal}
          account={account}
          state={modal}
        />
      );
    default:
      return null;
  }
}

export type WalletModalHostProps = {
  account: string;
  viewerUsername: string | null;
  children: React.ReactNode;
};

function WalletModalHostInner({
  account,
  viewerUsername,
  children,
}: WalletModalHostProps) {
  useHydrateWalletProvider();
  const canManage =
    viewerUsername?.trim().toLowerCase() === account.trim().toLowerCase();

  return (
    <>
      {children}
      {canManage ? <EngineTokenModals account={account} /> : null}
    </>
  );
}

export function WalletModalHost(props: WalletModalHostProps) {
  return (
    <EngineTokenModalProvider>
      <WalletModalHostInner {...props} />
    </EngineTokenModalProvider>
  );
}
