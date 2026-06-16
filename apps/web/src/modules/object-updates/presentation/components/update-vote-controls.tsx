'use client';

import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { UpdateVoteCountLink } from './update-vote-count-link';
import { UpdateVoteReportModal } from './update-vote-report-modal';
import type { DecisivePrivilegedVoteView } from './update-approval-status-block';

export type UpdateVoteControlsProps = {
  objectId: string;
  updateId: string;
  approvePercent: number;
  decisivePrivilegedVote?: DecisivePrivilegedVoteView | null;
  forCount: number;
  againstCount: number;
  forPreviewVoters?: readonly string[];
  againstPreviewVoters?: readonly string[];
  optimisticVote: 'for' | 'against' | null;
  voteDisabled: boolean;
  onVote: (vote: 'for' | 'against') => void;
  /** `gallery` = light text on the fullscreen gallery chrome. */
  variant?: 'card' | 'gallery';
  layoutClassName?: string;
};

const VOTE_ACTION_BASE_CLASS =
  'border-0 bg-transparent p-0 text-body-sm font-weight-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50';

function voteActionClass(
  side: 'for' | 'against',
  active: boolean,
  variant: 'card' | 'gallery',
): string {
  if (variant === 'gallery') {
    if (active && side === 'for') {
      return `${VOTE_ACTION_BASE_CLASS} text-validity-approved`;
    }
    if (active && side === 'against') {
      return `${VOTE_ACTION_BASE_CLASS} text-validity-rejected`;
    }
    return `${VOTE_ACTION_BASE_CLASS} text-white/75 hover:text-white`;
  }

  if (active && side === 'for') {
    return `${VOTE_ACTION_BASE_CLASS} text-validity-approved`;
  }
  if (active && side === 'against') {
    return `${VOTE_ACTION_BASE_CLASS} text-validity-rejected`;
  }
  return `${VOTE_ACTION_BASE_CLASS} text-fg-secondary hover:text-fg`;
}

export function UpdateVoteControls({
  objectId,
  updateId,
  approvePercent,
  decisivePrivilegedVote = null,
  forCount,
  againstCount,
  forPreviewVoters = [],
  againstPreviewVoters = [],
  optimisticVote,
  voteDisabled,
  onVote,
  variant = 'card',
  layoutClassName = 'mt-3 flex flex-wrap gap-3',
}: UpdateVoteControlsProps) {
  const { t } = useI18n();
  const [voteReportOpen, setVoteReportOpen] = useState(false);
  const openReport = () => {
    if (!updateId) {
      return;
    }
    setVoteReportOpen(true);
  };

  return (
    <>
      <div className={layoutClassName}>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            disabled={voteDisabled}
            aria-pressed={optimisticVote === 'for'}
            className={voteActionClass('for', optimisticVote === 'for', variant)}
            onClick={() => onVote('for')}
          >
            {t('object_updates_approve')}
          </button>
          <UpdateVoteCountLink
            count={forCount}
            previewVoters={forPreviewVoters}
            side="for"
            onOpenReport={openReport}
          />
        </div>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            disabled={voteDisabled}
            aria-pressed={optimisticVote === 'against'}
            className={voteActionClass('against', optimisticVote === 'against', variant)}
            onClick={() => onVote('against')}
          >
            {t('object_updates_reject')}
          </button>
          <UpdateVoteCountLink
            count={againstCount}
            previewVoters={againstPreviewVoters}
            side="against"
            onOpenReport={openReport}
          />
        </div>
      </div>
      <UpdateVoteReportModal
        open={voteReportOpen}
        objectId={objectId}
        updateId={updateId}
        approvePercent={approvePercent}
        decisivePrivilegedVote={decisivePrivilegedVote}
        initialForCount={forCount}
        initialAgainstCount={againstCount}
        onClose={() => setVoteReportOpen(false)}
      />
    </>
  );
}
