'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  formatValidityVotePreview,
  type ValidityVotePreviewSide,
} from '../../domain/format-validity-vote-preview';

export type UpdateVoteCountLinkProps = {
  count: number;
  previewVoters: readonly string[];
  side: ValidityVotePreviewSide;
  onOpenReport: () => void;
};

export function UpdateVoteCountLink({
  count,
  previewVoters,
  side,
  onOpenReport,
}: UpdateVoteCountLinkProps) {
  const { t } = useI18n();
  const preview = formatValidityVotePreview(count, previewVoters, t, side);

  if (count <= 0) {
    return (
      <span className="min-w-[1.25rem] text-center text-caption font-weight-label tabular-nums text-muted">
        0
      </span>
    );
  }

  const ariaLabel = preview ?? t('object_updates_view_voters');

  return (
    <button
      type="button"
      title={preview ?? undefined}
      aria-label={ariaLabel}
      className="min-w-[1.25rem] rounded-btn px-1 py-0.5 text-center text-caption font-weight-label tabular-nums text-fg-secondary transition-colors hover:bg-surface-control hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      onClick={(event) => {
        event.stopPropagation();
        onOpenReport();
      }}
    >
      {count}
    </button>
  );
}
