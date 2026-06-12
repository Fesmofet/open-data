'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { PostRewardView } from '../../application/dto/post-reward.dto';

import { StoryRewardDetail } from './story-reward-detail';

type StoryRewardModalProps = {
  open: boolean;
  reward: PostRewardView;
  postAuthor: string;
  onClose: () => void;
};

export function StoryRewardModal({
  open,
  reward,
  postAuthor,
  onClose,
}: StoryRewardModalProps) {
  const { t } = useI18n();

  const title =
    reward.phase === 'potential'
      ? t('payout_potential_payout_amount')
      : t('payout_total_past_payout_amount');

  return (
    <AppModal
      open={open}
      onClose={onClose}
      labelledBy="story-reward-modal-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2
          id="story-reward-modal-title"
          className="text-body-sm font-weight-label text-fg"
        >
          {title}
        </h2>
        <AppModalCloseButton onClose={onClose} />
      </div>
      <div className="px-4 py-3">
        <StoryRewardDetail
          reward={reward}
          postAuthor={postAuthor}
          variant="modal"
        />
      </div>
    </AppModal>
  );
}
