'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { PaginatedObjectExpertListView } from '@/modules/object/domain/types/object-experts';
import { StatHoverTooltip, UserAvatar } from '@/shared/presentation';

import { buildObjectExpertsPath } from '../../domain/object-page-url.constants';

const RIGHT_RAIL_MAX_ITEMS = 5;

export type ObjectRightExpertsSectionProps = {
  objectId: string;
  page: PaginatedObjectExpertListView;
};

export function ObjectRightExpertsSection({
  objectId,
  page,
}: ObjectRightExpertsSectionProps) {
  const { t } = useI18n();
  const visible = page.items.slice(0, RIGHT_RAIL_MAX_ITEMS);
  const hasMore = page.hasMore || page.total > RIGHT_RAIL_MAX_ITEMS;

  return (
    <aside className="w-full rounded-card border border-border bg-surface/60 px-3 py-card-padding text-body-sm text-muted">
      <p className="font-weight-label text-fg">{t('experts')}</p>
      <ul className="mt-3 w-full space-y-2">
        {visible.map((row) => (
          <li key={row.name} className="w-full">
            <Link
              href={`/@${row.name}`}
              className="flex w-full min-w-0 items-center gap-2 rounded-btn border border-border bg-bg p-2 transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              suppressHydrationWarning
            >
              <UserAvatar
                username={row.name}
                avatarUrl={row.avatarUrl}
                displayName={row.name}
                size={40}
              />
              <p className="min-w-0 flex-1 truncate text-body-sm font-weight-label leading-body text-fg">
                {row.name}
              </p>
              <StatHoverTooltip content={t('stat_object_expertise_tooltip')}>
                <span className="shrink-0 rounded-btn border border-border bg-surface-control px-2 py-0.5 font-mono text-body-sm tabular-nums text-fg">
                  {row.objectExpertiseWeight.toFixed(2)}
                </span>
              </StatHoverTooltip>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Link
          href={buildObjectExpertsPath(objectId)}
          className="mt-3 inline-block text-body-sm font-weight-label text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          suppressHydrationWarning
        >
          {t('object_right_show_more')}
        </Link>
      ) : null}
    </aside>
  );
}
