'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { PROFILE_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';

import type { CategoryNavData } from '../../domain/types/category-nav';
import { CategoryNavChrome } from './category-nav-chrome';

export type CategoryNavPanelProps = {
  data: CategoryNavData | null;
  basePath: string;
  sectionKey: 'user-shop' | 'recipe';
  lineageSegments: string[];
};

export function CategoryNavPanel({
  data,
  basePath,
  sectionKey,
  lineageSegments,
}: CategoryNavPanelProps) {
  const { t } = useI18n();

  return (
    <aside
      className={[
        PROFILE_RAIL_STICKY_CLASS,
        'rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted',
      ].join(' ')}
      aria-label={t('profile_categories_title')}
    >
      <p className="font-weight-label text-fg">{t('profile_categories_title')}</p>
      {data === null ? (
        <p className="mt-2 text-body-sm text-muted">{t('profile_categories_unavailable')}</p>
      ) : (
        <CategoryNavChrome
          data={data}
          basePath={basePath}
          sectionKey={sectionKey}
          lineageSegments={lineageSegments}
        />
      )}
    </aside>
  );
}
