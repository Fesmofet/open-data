'use client';

import { useCallback, useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PostRewardView } from '../../application/dto/post-reward.dto';

import { StoryRewardDetail } from './story-reward-detail';

type StoryRewardModalProps = {
  open: boolean;
  reward: PostRewardView;
  postAuthor: string;
  onClose: () => void;
};

function IconClose() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function StoryRewardModal({
  open,
  reward,
  postAuthor,
  onClose,
}: StoryRewardModalProps) {
  const { t } = useI18n();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    window.addEventListener('keydown', handleKeyDown);
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('modal-open');
      document.documentElement.style.paddingRight = '';
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const title =
    reward.phase === 'potential'
      ? t('payout_potential_payout_amount')
      : t('payout_total_past_payout_amount');

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-overlay/50 backdrop-blur-[1px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-reward-modal-title"
          className="w-full max-w-md rounded-card border border-border bg-surface shadow-card-float"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2
              id="story-reward-modal-title"
              className="text-body-sm font-weight-label text-fg"
            >
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-circle text-fg-secondary hover:bg-surface-control hover:text-fg"
            >
              <IconClose />
            </button>
          </div>
          <div className="px-4 py-3">
            <StoryRewardDetail
              reward={reward}
              postAuthor={postAuthor}
              variant="modal"
            />
          </div>
        </div>
      </div>
    </>
  );
}
