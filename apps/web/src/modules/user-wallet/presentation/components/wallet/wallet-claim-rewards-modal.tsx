'use client';

import { useId } from 'react';

import { buildClaimRewardBalanceOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { WalletClaimRewardsModalState } from '../../../domain/wallet-modal-types';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';

export type WalletClaimRewardsModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletClaimRewardsModalState;
};

function RewardRow({
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

export function WalletClaimRewardsModal({
  open,
  onClose,
  account,
  state,
}: WalletClaimRewardsModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error } = useHiveBroadcast(account);
  const { pendingRewards } = state;

  const showHive = Number.parseFloat(pendingRewards.display.hive) > 0;
  const showHbd = Number.parseFloat(pendingRewards.display.hbd) > 0;
  const showHp = Number.parseFloat(pendingRewards.display.hp) > 0;

  const onSubmit = async () => {
    const ok = await broadcast([
      buildClaimRewardBalanceOp({
        account,
        rewardHive: pendingRewards.hive,
        rewardHbd: pendingRewards.hbd,
        rewardVests: pendingRewards.vesting,
      }),
    ]);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('rewards')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <div className="divide-y divide-border border-t border-border">
          {showHive ? (
            <RewardRow
              label={t('hive')}
              amount={pendingRewards.display.hive}
              suffix="HIVE"
            />
          ) : null}
          {showHbd ? (
            <RewardRow
              label={t('steem_dollar')}
              amount={pendingRewards.display.hbd}
              suffix="HBD"
            />
          ) : null}
          {showHp ? (
            <RewardRow
              label={t('steem_power')}
              amount={pendingRewards.display.hp}
              suffix="HP"
            />
          ) : null}
        </div>
        {error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(engineTokenBroadcastErrorMessageKey(error))}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-btn bg-accent px-4 py-2 text-body font-weight-label text-accent-fg disabled:opacity-50"
          disabled={pending}
          onClick={() => void onSubmit()}
        >
          {pending ? '…' : t('claim_rewards')}
        </button>
      </div>
    </AppModal>
  );
}
