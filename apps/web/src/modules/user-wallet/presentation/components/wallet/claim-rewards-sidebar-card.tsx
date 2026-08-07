'use client';

import { useEffectiveViewerUsername } from '@/modules/object-updates/application/use-effective-viewer-username';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { useWalletModal } from './wallet-modal-context';
import { useWalletBalances } from './wallet-balances-context';

const CARD_CLASS =
  'space-y-2 rounded-card border border-border bg-surface/60 p-card-padding';

export type ClaimRewardsSidebarCardProps = {
  accountName: string;
  viewerUsername?: string | null;
};

function RewardPreviewRow({
  label,
  amount,
  suffix,
}: {
  label: string;
  amount: string;
  suffix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-body-sm">
      <span className="font-weight-strong text-fg">{label}</span>
      <span className="font-weight-strong text-fg">
        {amount} {suffix}
      </span>
    </div>
  );
}

export function ClaimRewardsSidebarCard({
  accountName,
  viewerUsername = null,
}: ClaimRewardsSidebarCardProps) {
  const { t } = useI18n();
  const { openModal } = useWalletModal();
  const { hiveSummary } = useWalletBalances();
  const resolvedViewer = useEffectiveViewerUsername(viewerUsername);
  const canManage =
    resolvedViewer?.trim().toLowerCase() === accountName.trim().toLowerCase();
  const pendingRewards = hiveSummary?.pendingRewards;

  if (!canManage || !pendingRewards?.hasRewards) {
    return null;
  }

  const showHive = Number.parseFloat(pendingRewards.display.hive) > 0;
  const showHbd = Number.parseFloat(pendingRewards.display.hbd) > 0;
  const showHp = Number.parseFloat(pendingRewards.display.hp) > 0;

  return (
    <div className={CARD_CLASS}>
      <h3 className="text-body font-weight-strong text-fg">{t('rewards')}</h3>
      <div className="divide-y divide-border border-t border-border">
        {showHive ? (
          <RewardPreviewRow
            label={t('hive')}
            amount={pendingRewards.display.hive}
            suffix="HIVE"
          />
        ) : null}
        {showHbd ? (
          <RewardPreviewRow
            label={t('steem_dollar')}
            amount={pendingRewards.display.hbd}
            suffix="HBD"
          />
        ) : null}
        {showHp ? (
          <RewardPreviewRow
            label={t('steem_power')}
            amount={pendingRewards.display.hp}
            suffix="HP"
          />
        ) : null}
      </div>
      <button
        type="button"
        className="flex w-full min-w-0 items-center justify-center rounded-btn bg-accent px-4 py-2 text-center text-body font-weight-strong text-accent-fg"
        onClick={() =>
          openModal({ kind: 'claimRewards', pendingRewards })
        }
      >
        {t('claim_rewards')}
      </button>
    </div>
  );
}
