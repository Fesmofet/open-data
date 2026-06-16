'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton, UserAvatar } from '@/shared/presentation';

import type { UpdateVoterRowView } from '../../application/dto/update-voters.dto';
import { loadUpdateVotersAction } from '../../infrastructure/actions/load-update-voters.action';
import {
  UpdateApprovalStatusBlock,
  type DecisivePrivilegedVoteView,
} from './update-approval-status-block';

const EVENT_SEQ_TOOLTIP_Z_INDEX = 1_200;

function VoterPrivilegedTierBadge({
  tier,
}: {
  tier: UpdateVoterRowView['privileged_tier'];
}) {
  const { t } = useI18n();
  if (tier == null) {
    return null;
  }
  const label =
    tier === 'admin'
      ? t('object_updates_voter_tier_admin')
      : t('object_updates_voter_tier_trusted');
  return (
    <span className="shrink-0 text-caption font-weight-label text-muted">({label})</span>
  );
}

function EventSeqRow({ eventSeq }: { eventSeq: string }) {
  const { t } = useI18n();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const openTooltip = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setTooltipPos({ top: rect.top, left: rect.left });
    setTooltipOpen(true);
  };

  const tooltip =
    mounted && tooltipOpen
      ? createPortal(
          <div
            className="pointer-events-none fixed w-max max-w-[min(16rem,calc(100vw-2rem))]"
            style={{
              zIndex: EVENT_SEQ_TOOLTIP_Z_INDEX,
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: 'translateY(calc(-100% - 0.5rem))',
            }}
            role="tooltip"
          >
            <div className="rounded-card border border-border bg-surface-raised px-3 py-2 text-caption text-fg shadow-card-float">
              {t('object_updates_event_seq_help')}
            </div>
            <div
              className="absolute left-2 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-border bg-surface-raised"
              aria-hidden
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        aria-label={t('object_updates_event_seq_help_aria')}
        className="inline-block cursor-help text-caption text-muted focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onMouseEnter={openTooltip}
        onMouseLeave={() => setTooltipOpen(false)}
        onFocus={openTooltip}
        onBlur={() => setTooltipOpen(false)}
      >
        {t('object_updates_event_seq_label')}{' '}
        <span className="tabular-nums text-fg-secondary">{eventSeq}</span>
      </span>
      {tooltip}
    </>
  );
}

export type UpdateVoteReportModalProps = {
  open: boolean;
  objectId: string;
  updateId: string;
  approvePercent?: number;
  decisivePrivilegedVote?: DecisivePrivilegedVoteView | null;
  initialForCount: number;
  initialAgainstCount: number;
  onClose: () => void;
};

function VoterList({
  side,
  heading,
  count,
  voters,
  emptyLabel,
}: {
  side: 'for' | 'against';
  heading: string;
  count: number;
  voters: UpdateVoterRowView[];
  emptyLabel: string;
}) {
  const headingClass =
    side === 'for'
      ? 'mb-2 text-body-sm font-weight-strong text-validity-approved'
      : 'mb-2 text-body-sm font-weight-strong text-validity-rejected';

  return (
    <section className="min-w-0 flex-1">
      <h3 className={headingClass}>
        {heading} ({count})
      </h3>
      {voters.length === 0 ? (
        <p className="text-body-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {voters.map((row) => {
            const displayName = row.profile.displayName?.trim() || row.voter;
            const profileHref = `/@${encodeURIComponent(row.voter)}`;
            return (
              <li key={row.voter} className="flex items-start gap-3 py-2">
                <UserAvatar
                  username={row.voter}
                  avatarUrl={row.profile.avatarUrl}
                  size={32}
                  displayName={displayName}
                  className="size-8 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <Link
                      href={profileHref}
                      suppressHydrationWarning
                      className="truncate text-body-sm font-weight-label text-link hover:underline"
                    >
                      {displayName}
                    </Link>
                    <VoterPrivilegedTierBadge tier={row.privileged_tier} />
                  </div>
                  <EventSeqRow eventSeq={row.event_seq} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function UpdateVoteReportModal({
  open,
  objectId,
  updateId,
  approvePercent,
  decisivePrivilegedVote = null,
  initialForCount,
  initialAgainstCount,
  onClose,
}: UpdateVoteReportModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forVoters, setForVoters] = useState<UpdateVoterRowView[]>([]);
  const [againstVoters, setAgainstVoters] = useState<UpdateVoterRowView[]>([]);
  const [forCount, setForCount] = useState(initialForCount);
  const [againstCount, setAgainstCount] = useState(initialAgainstCount);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForCount(initialForCount);
    setAgainstCount(initialAgainstCount);
    setError(null);
    setLoading(true);
    void loadUpdateVotersAction(objectId, updateId)
      .then((page) => {
        if (!page) {
          setError(t('object_updates_vote_report_error'));
          setForVoters([]);
          setAgainstVoters([]);
          return;
        }
        setForCount(page.for_count);
        setAgainstCount(page.against_count);
        setForVoters(page.for_voters);
        setAgainstVoters(page.against_voters);
      })
      .catch(() => {
        setError(t('object_updates_vote_report_error'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialAgainstCount, initialForCount, objectId, open, t, updateId]);

  if (!open) {
    return null;
  }

  const header = (
  <div className="flex items-start justify-between gap-3 border-b border-border px-card-padding py-3">
      <div>
        <h2 id="update-vote-report-title" className="text-body font-weight-label text-fg">
          {t('object_updates_vote_report_title')}
        </h2>
      </div>
      <ModalShellCloseButton onClose={onClose} ariaLabel={t('close')} />
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="update-vote-report-title"
      maxWidthClass="max-w-container-narrow"
      panelClassName="rounded-card-lg"
      header={header}
    >
      <div className="p-card-padding">
        {approvePercent != null ? (
          <div className="mb-6 border-b border-border pb-4">
            <UpdateApprovalStatusBlock
              approvePercent={approvePercent}
              decisivePrivilegedVote={decisivePrivilegedVote}
            />
          </div>
        ) : null}
        {loading ? (
          <p className="text-body-sm text-muted">{t('drafts_loading')}</p>
        ) : error ? (
          <p className="text-body-sm text-accent" role="alert">
            {error}
          </p>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <VoterList
              side="for"
              heading={t('object_updates_approve')}
              count={forCount}
              voters={forVoters}
              emptyLabel={t('object_updates_vote_report_empty')}
            />
            <VoterList
              side="against"
              heading={t('object_updates_reject')}
              count={againstCount}
              voters={againstVoters}
              emptyLabel={t('object_updates_vote_report_empty')}
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
