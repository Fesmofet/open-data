'use client';

import { useCallback } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { profileSectionTabClass } from '@/shared/presentation';
import {
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

import type { OwnershipSubType } from '../../domain/object-page.types';

export type ObjectOwnershipSubNavProps = {
  supervisedCount: number;
  exclusiveCount: number;
  activeSub: OwnershipSubType;
  onSelect: (sub: OwnershipSubType) => void;
};

export function ObjectOwnershipSubNav({
  supervisedCount,
  exclusiveCount,
  activeSub,
  onSelect,
}: ObjectOwnershipSubNavProps) {
  const { t } = useI18n();

  const mkLabel = useCallback(
    (sub: OwnershipSubType, count: number): string => {
      const base =
        sub === 'supervised'
          ? t('object_ownership_sub_supervised')
          : t('object_ownership_sub_exclusive');
      return `${base} (${count})`;
    },
    [t],
  );

  return (
    <div className={horizontalTabNavScrollShellClass('card')}>
      <nav
        aria-label={t('object_ownership_sub_nav_aria')}
        className={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
      >
        {(['supervised', 'exclusive'] as const).map((sub) => {
          const active = activeSub === sub;
          const count = sub === 'supervised' ? supervisedCount : exclusiveCount;
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
      </nav>
    </div>
  );
}
