'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { StatHoverTooltip } from '@/shared/presentation';
import { HorizontalTabNavWithOverflow } from '@/shared/presentation/layout/horizontal-tab-nav-with-overflow';

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

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((tab) => tab.segment === activeSegment)),
    [activeSegment, tabs],
  );

  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.segment,
        active: activeSegment === tab.segment,
        label: (
          <span className="inline-flex items-center gap-1">
            <span>{tab.label}</span>
            {renderTabCount(tab, t)}
          </span>
        ),
        onSelect: () => {
          onSelect(tab.segment);
        },
      })),
    [activeSegment, onSelect, t, tabs],
  );

  return (
    <HorizontalTabNavWithOverflow
      items={items}
      activeIndex={activeIndex}
      ariaLabel={t('object_detail_primary_nav_aria')}
      moreLabel={t('object_detail_nav_more')}
      moreMenuAriaLabel={t('object_detail_nav_more')}
      bleed="gutter"
      rowClassName="justify-center gap-x-1"
    />
  );
}
