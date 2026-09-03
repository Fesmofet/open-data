'use client';

import { useCallback } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass } from '@/shared/presentation';
import { HORIZONTAL_TAB_NAV_SUB_ROW_CLASS } from '@/shared/presentation/layout/horizontal-tab-nav-classes';
import { ScrollableHorizontalTabNav } from '@/shared/presentation/layout/scrollable-horizontal-tab-nav';

import type { FollowersSubType } from '../../domain/object-page.types';

export type ObjectFollowersSubNavProps = {
  followedByCount: number;
  favoritedByCount: number;
  activeSub: FollowersSubType;
  onSelect: (sub: FollowersSubType) => void;
};

export function ObjectFollowersSubNav({
  followedByCount,
  favoritedByCount,
  activeSub,
  onSelect,
}: ObjectFollowersSubNavProps) {
  const { t } = useI18n();

  const mkLabel = useCallback(
    (sub: FollowersSubType, count: number): string => {
      const base =
        sub === 'followed'
          ? t('object_followers_sub_followed_by')
          : t('object_followers_sub_favorited_by');
      return `${base} (${count})`;
    },
    [t],
  );

  return (
    <ScrollableHorizontalTabNav
      ariaLabel={t('object_followers_sub_nav_aria')}
      rowClass={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
      bleed="card"
      activeItemSelector="nav button.text-accent"
      scrollPrevAriaLabel={t('previous')}
      scrollNextAriaLabel={t('next')}
    >
      {(['followed', 'favorited'] as const).map((sub) => {
        const active = activeSub === sub;
        const count = sub === 'followed' ? followedByCount : favoritedByCount;
        return (
          <button
            key={sub}
            type="button"
            className={profileSectionTabClass(active, 'sub')}
            onClick={() => onSelect(sub)}
          >
            {mkLabel(sub, count)}
          </button>
        );
      })}
    </ScrollableHorizontalTabNav>
  );
}
