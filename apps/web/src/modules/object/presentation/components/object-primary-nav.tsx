'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass, StatHoverTooltip } from '@/shared/presentation';

import type { ObjectPrimaryTabView } from '../../domain/object-page.types';

export type ObjectPrimaryNavProps = {
  tabs: ObjectPrimaryTabView[];
  activeSegment: string;
  onSelect: (segment: string) => void;
};

function renderTabCount(
  tab: ObjectPrimaryTabView,
  t: (key: string) => string,
): ReactNode {
  if (typeof tab.count !== 'number') {
    return null;
  }

  const countNode = <span className="tabular-nums">{tab.count}</span>;

  if (tab.segment === 'followers') {
    return (
      <StatHoverTooltip content={t('stat_object_followers_tooltip')}>
        {countNode}
      </StatHoverTooltip>
    );
  }

  if (tab.segment === 'experts') {
    return (
      <StatHoverTooltip content={t('stat_object_expertise_tooltip')}>
        {countNode}
      </StatHoverTooltip>
    );
  }

  return countNode;
}

export function ObjectPrimaryNav({
  tabs,
  activeSegment,
  onSelect,
}: ObjectPrimaryNavProps) {
  const { t } = useI18n();

  return (
    <nav
      aria-label={t('object_detail_primary_nav_aria')}
      className="flex flex-wrap gap-x-1 gap-y-1 border-b border-border"
    >
      {tabs.map((tab) => {
        const active = activeSegment === tab.segment;
        const count = renderTabCount(tab, t);

        return (
          <button
            key={tab.segment}
            type="button"
            className={profileSectionTabClass(active, 'primary')}
            onClick={() => onSelect(tab.segment)}
          >
            <span className="inline-flex items-center gap-1">
              <span>{tab.label}</span>
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
