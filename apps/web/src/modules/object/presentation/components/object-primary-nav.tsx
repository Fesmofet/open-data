'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass, StatHoverTooltip } from '@/shared/presentation';
import { HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS } from '@/shared/presentation/layout/horizontal-tab-nav-classes';
import { ScrollableHorizontalTabNav } from '@/shared/presentation/layout/scrollable-horizontal-tab-nav';

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
    <ScrollableHorizontalTabNav
      ariaLabel={t('object_detail_primary_nav_aria')}
      rowClass={`${HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS} gap-x-1`}
      bleed="gutter"
      centerWhenNoOverflow
      activeItemSelector="nav button.text-accent"
      scrollPrevAriaLabel={t('previous')}
      scrollNextAriaLabel={t('next')}
    >
      {tabs.map((tab) => {
        const active = activeSegment === tab.segment;
        return (
          <button
            key={tab.segment}
            type="button"
            className={profileSectionTabClass(active, 'primary')}
            onClick={() => onSelect(tab.segment)}
          >
            <span className="inline-flex items-center gap-1">
              <span>{tab.label}</span>
              {renderTabCount(tab, t)}
            </span>
          </button>
        );
      })}
    </ScrollableHorizontalTabNav>
  );
}
