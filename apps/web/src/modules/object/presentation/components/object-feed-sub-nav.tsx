'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass } from '@/shared/presentation';
import {
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

import type { ObjectFeedSubTabView } from '../../domain/object-page.types';

export type ObjectFeedSubNavProps = {
  tabs: ObjectFeedSubTabView[];
  activeSegment: string;
  onSelect: (segment: string) => void;
};

export function ObjectFeedSubNav({
  tabs,
  activeSegment,
  onSelect,
}: ObjectFeedSubNavProps) {
  const { t } = useI18n();

  return (
    <div className={horizontalTabNavScrollShellClass('card')}>
      <nav
        aria-label={t('object_detail_feed_sub_nav_aria')}
        className={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
      >
        {tabs.map((tab) => {
          const active = activeSegment === tab.segment;
          return (
            <button
              key={tab.segment}
              type="button"
              className={profileSectionTabClass(active, 'sub')}
              onClick={() => onSelect(tab.segment)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
