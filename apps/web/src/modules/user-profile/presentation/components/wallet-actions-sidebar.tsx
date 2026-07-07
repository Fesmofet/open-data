'use client';

import { useEffectiveViewerUsername } from '@/modules/object-updates/application/use-effective-viewer-username';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { useEffectiveProfileNav } from '@/modules/user-profile/presentation/components/user-profile-pending-nav-context';
import { getWalletTypeFromSearch } from '@/modules/user-profile/presentation/components/user-profile-subnav';
import { PROFILE_FILTER_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';
import {
  getDefaultWalletAssetForTab,
} from '@/modules/user-wallet/domain/wallet-tab-defaults';
import { useWalletModal } from '@/modules/user-wallet/presentation/components/wallet/wallet-modal-context';

export type WalletActionsSidebarProps = {
  accountName: string;
  viewerUsername?: string | null;
};

function WalletActionButton({
  label,
  onClick,
  variant = 'secondary',
}: {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      type="button"
      className={[
        'w-full rounded-btn px-4 py-2 text-body font-weight-strong',
        variant === 'primary'
          ? 'bg-accent text-accent-fg'
          : 'border border-border bg-surface-control text-fg',
      ].join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function WalletActionsButtons({
  walletType,
}: {
  walletType: ReturnType<typeof getWalletTypeFromSearch>;
}) {
  const { t } = useI18n();
  const { openModal } = useWalletModal();
  const defaultAsset = getDefaultWalletAssetForTab(walletType);
  const showDelegations =
    walletType === 'ENGINE' || walletType === 'WAIV' || walletType === 'HIVE';
  const showSwapDepositWithdraw = walletType === 'ENGINE' || walletType === 'WAIV';

  return (
    <aside
      className={[
        PROFILE_FILTER_RAIL_STICKY_CLASS,
        'space-y-2 rounded-card border border-border bg-surface/60 p-card-padding',
      ].join(' ')}
    >
      <WalletActionButton
        label={t('transfer')}
        variant="primary"
        onClick={() => openModal({ kind: 'transfer', asset: defaultAsset })}
      />
      <div className="grid grid-cols-2 gap-2">
        <WalletActionButton
          label={t('power_up')}
          onClick={() => openModal({ kind: 'power', mode: 'up', asset: defaultAsset })}
        />
        <WalletActionButton
          label={t('power_down')}
          onClick={() => openModal({ kind: 'power', mode: 'down', asset: defaultAsset })}
        />
      </div>
      {showDelegations ? (
        <WalletActionButton
          label={t('manage_delegations')}
          onClick={() => openModal({ kind: 'manage', asset: defaultAsset })}
        />
      ) : null}
      {showSwapDepositWithdraw ? (
        <>
          <WalletActionButton
            label={t('swap_tokens')}
            variant="primary"
            onClick={() => openModal({ kind: 'swap', fromSymbol: 'WAIV' })}
          />
          <div className="grid grid-cols-2 gap-2">
            <WalletActionButton
              label={t('deposit')}
              onClick={() => openModal({ kind: 'deposit' })}
            />
            <WalletActionButton
              label={t('withdraw')}
              onClick={() => openModal({ kind: 'withdraw' })}
            />
          </div>
        </>
      ) : null}
    </aside>
  );
}

export function WalletActionsSidebar({
  accountName: _accountName,
  viewerUsername: serverViewerUsername = null,
}: WalletActionsSidebarProps) {
  const { search } = useEffectiveProfileNav();
  const walletType = getWalletTypeFromSearch(search);
  const viewerUsername = useEffectiveViewerUsername(serverViewerUsername);
  const canManage =
    viewerUsername?.trim().toLowerCase() === _accountName.trim().toLowerCase();

  if (!canManage) {
    return null;
  }

  return <WalletActionsButtons walletType={walletType} />;
}
