'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PostRewardView } from '../../application/dto/post-reward.dto';

import { StoryRewardModal } from './story-reward-modal';
import { StoryRewardTooltip } from './story-reward-tooltip';

type StoryRewardBadgeProps = {
  reward: PostRewardView | null | undefined;
  waivRewardEligible: boolean;
  postAuthor: string;
};

function IconFlashlight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6h-6l-2-4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
      <path d="M10 16l2-4 2 4" />
    </svg>
  );
}

function WaivEligibleBadge() {
  const { t } = useI18n();
  return (
    <span
      className="group/waiv relative inline-flex shrink-0 items-center"
      title={t('eligible_for_waiv')}
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={24}
        height={24}
        className="size-6 rounded-circle object-cover"
        unoptimized
      />
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded-btn bg-surface-raised px-2 py-0.5 text-caption text-fg opacity-0 shadow-card transition-opacity group-hover/waiv:opacity-100"
        role="tooltip"
      >
        {t('eligible_for_waiv')}
      </span>
    </span>
  );
}

function RewardPowerOnlyHint() {
  const { t } = useI18n();
  return (
    <span
      className="inline-flex text-muted"
      title={t('reward_option_100')}
      aria-label={t('reward_option_100')}
    >
      <IconFlashlight />
    </span>
  );
}

export function StoryRewardBadge({
  reward,
  waivRewardEligible,
  postAuthor,
}: StoryRewardBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!reward) {
    return null;
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        {waivRewardEligible ? <WaivEligibleBadge /> : null}
        {reward.rewardPowerOnly ? <RewardPowerOnlyHint /> : null}
        <StoryRewardTooltip
          reward={reward}
          postAuthor={postAuthor}
          waivRewardEligible={waivRewardEligible}
          onLabelClick={() => setModalOpen(true)}
        />
      </div>
      <StoryRewardModal
        open={modalOpen}
        reward={reward}
        postAuthor={postAuthor}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
