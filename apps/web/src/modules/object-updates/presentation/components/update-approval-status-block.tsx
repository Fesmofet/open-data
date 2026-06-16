'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { ObjectUpdateFeedItemView } from '../../application/dto/object-updates-feed.dto';
import { OBJECT_UPDATES_MIN_APPROVAL_PERCENT } from '../../constants';

export type DecisivePrivilegedVoteView = NonNullable<
  ObjectUpdateFeedItemView['decisive_privileged_vote']
>;

export function approvalStatusBadgeClass(positive: boolean): string {
  return `rounded-pill border border-border px-2 py-0.5 text-caption font-weight-label tabular-nums ${
    positive ? 'text-validity-approved' : 'text-validity-rejected'
  }`;
}

export function decisivePrivilegedVoteLabelKey(
  tier: 'admin' | 'trusted',
  vote: 'for' | 'against',
): string {
  if (tier === 'admin') {
    return vote === 'for'
      ? 'object_updates_approved_by_admin'
      : 'object_updates_rejected_by_admin';
  }
  return vote === 'for'
    ? 'object_updates_approved_by_trusted'
    : 'object_updates_rejected_by_trusted';
}

function profileHrefForUsername(username: string): string {
  return `/@${encodeURIComponent(username)}`;
}

export type UpdateApprovalStatusBlockProps = {
  approvePercent: number;
  decisivePrivilegedVote?: DecisivePrivilegedVoteView | null;
};

export function UpdateApprovalStatusBlock({
  approvePercent,
  decisivePrivilegedVote = null,
}: UpdateApprovalStatusBlockProps) {
  const { t, locale } = useI18n();
  const meetsThreshold = approvePercent > OBJECT_UPDATES_MIN_APPROVAL_PERCENT;
  const approvePercentLabel = approvePercent.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-sm text-fg">{t('object_updates_approval')}</span>
        <span className={approvalStatusBadgeClass(meetsThreshold)}>
          {approvePercentLabel}%
        </span>
      </div>
      {decisivePrivilegedVote ? (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={approvalStatusBadgeClass(decisivePrivilegedVote.vote === 'for')}
          >
            {decisivePrivilegedVote.vote === 'for' ? t('approved') : t('rejected')}
          </span>
          <span className="text-body-sm text-fg">
            {t(
              decisivePrivilegedVoteLabelKey(
                decisivePrivilegedVote.tier,
                decisivePrivilegedVote.vote,
              ),
            )}{' '}
            <Link
              href={profileHrefForUsername(decisivePrivilegedVote.voter)}
              className="text-accent hover:underline focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              suppressHydrationWarning
            >
              @{decisivePrivilegedVote.voter}
            </Link>
          </span>
        </div>
      ) : null}
    </div>
  );
}
