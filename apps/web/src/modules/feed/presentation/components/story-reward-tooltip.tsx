'use client';

import type { PostRewardView } from '../../application/dto/post-reward.dto';

import { StoryRewardDetail } from './story-reward-detail';

type StoryRewardTooltipProps = {
  reward: PostRewardView;
  postAuthor: string;
  waivRewardEligible: boolean;
  onLabelClick: () => void;
};

export function StoryRewardTooltip({
  reward,
  postAuthor,
  waivRewardEligible,
  onLabelClick,
}: StoryRewardTooltipProps) {
  const labelClass = waivRewardEligible
    ? 'text-accent'
    : 'text-fg-secondary group-hover:text-accent';

  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        title={String(reward.amount)}
        onClick={onLabelClick}
        className={[
          'rounded-btn px-1 py-0.5 text-body-sm font-weight-strong tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          labelClass,
        ].join(' ')}
      >
        {reward.label}
      </button>
      <div
        className="pointer-events-none absolute bottom-full end-0 z-50 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        role="tooltip"
      >
        <div className="rounded-card border border-border bg-surface-raised px-3 py-2 shadow-card-float">
          <StoryRewardDetail
            reward={reward}
            postAuthor={postAuthor}
            variant="tooltip"
          />
        </div>
        <div
          className="ms-auto me-3 h-2 w-2 rotate-45 border-b border-r border-border bg-surface-raised"
          aria-hidden
        />
      </div>
    </div>
  );
}
