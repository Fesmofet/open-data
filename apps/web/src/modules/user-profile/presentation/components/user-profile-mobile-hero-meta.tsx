'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { getHiveReputationRankKey } from '../../domain/get-hive-reputation-rank';
import type { UserAccountSidebarView } from '../../domain/types/user-account-sidebar-view';
import { formatSidebarUsd } from '../utils/account-sidebar-format';

function RankRibbonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.7l5.4-.8L12 2z" />
    </svg>
  );
}

export type UserProfileMobileHeroMetaProps = {
  sidebar: UserAccountSidebarView;
  isLoading?: boolean;
};

export function UserProfileMobileHeroMeta({
  sidebar,
  isLoading = false,
}: UserProfileMobileHeroMetaProps) {
  const { t, locale } = useI18n();
  const rankKey = getHiveReputationRankKey(sidebar.hive.reputation);

  if (isLoading) {
    return (
      <div className="lg:hidden flex w-full max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="h-6 w-24 animate-pulse rounded-btn bg-surface" />
        <div className="h-6 w-36 animate-pulse rounded-btn bg-surface" />
      </div>
    );
  }

  return (
    <div className="lg:hidden flex w-full max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 text-body-sm text-muted">
      <span className="inline-flex items-center gap-1.5 rounded-btn bg-surface px-2 py-0.5 text-fg">
        <RankRibbonIcon />
        <span className="font-weight-label">{t(rankKey)}</span>
      </span>
      <span>
        {t('vote_value')}:{' '}
        <span className="tabular-nums text-fg">
          {formatSidebarUsd(sidebar.totalVoteValueUsd, locale)}
        </span>
      </span>
    </div>
  );
}
