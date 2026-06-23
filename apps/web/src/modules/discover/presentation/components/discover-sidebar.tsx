'use client';

import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatObjectTypeLabel } from '@/modules/app-header/domain/search-nav-list';
import { OptimisticNavLink, useEffectiveNav } from '@/shared/presentation';

import { buildDiscoverHref, parseDiscoverPageState } from '../../domain/discover-url';
import { listDiscoverObjectTypes } from '../../domain/discover-registry';

const TYPES_INITIAL = 10;

export type DiscoverSidebarProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  sort: 'newest' | 'oldest' | 'rank';
};

export function DiscoverSidebar(_props: DiscoverSidebarProps) {
  const { t } = useI18n();
  const effectiveNav = useEffectiveNav();
  const { usersMode, objectType, q, sort } = useMemo(
    () => parseDiscoverPageState(new URLSearchParams(effectiveNav.search)),
    [effectiveNav.search],
  );

  const types = useMemo(() => listDiscoverObjectTypes(), []);
  const [showAllTypes, setShowAllTypes] = useState(false);

  const activeIndex =
    !usersMode && objectType ? types.indexOf(objectType) : -1;
  const activeBeyondInitial = activeIndex >= TYPES_INITIAL;

  const visibleTypes = useMemo(() => {
    if (showAllTypes || activeBeyondInitial) {
      return types;
    }
    return types.slice(0, TYPES_INITIAL);
  }, [types, showAllTypes, activeBeyondInitial]);

  const hiddenCount = Math.max(0, types.length - TYPES_INITIAL);
  const showMoreButton =
    hiddenCount > 0 && !showAllTypes && !activeBeyondInitial;

  return (
    <aside className="min-w-0 self-start space-y-6 lg:sticky lg:top-[calc(var(--app-header-height,4rem)+1rem)] lg:max-h-[calc(100dvh-var(--app-header-height,4rem)-2rem)] lg:overflow-y-auto">
      <section>
        <h2 className="mb-2 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
          {t('discover_objects_menu')}
        </h2>
        <ul className="flex flex-col gap-0.5">
          {visibleTypes.map((type) => {
            const active = !usersMode && objectType === type;
            return (
              <li key={type}>
                <OptimisticNavLink
                  href={buildDiscoverHref({ type, q, sort })}
                  suppressHydrationWarning
                  className={[
                    'block rounded-btn px-2 py-1.5 text-body-sm transition-colors',
                    active
                      ? 'bg-accent/15 font-weight-label text-accent'
                      : 'text-fg-secondary hover:bg-ghost-surface hover:text-fg',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {formatObjectTypeLabel(type)}
                </OptimisticNavLink>
              </li>
            );
          })}
        </ul>
        {showMoreButton ? (
          <button
            type="button"
            className="mt-1 px-2 text-caption text-accent underline-offset-2 hover:underline"
            onClick={() => setShowAllTypes(true)}
          >
            {t('discover_show_more')} ({hiddenCount})
          </button>
        ) : null}
      </section>
      <section>
        <h2 className="mb-2 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
          {t('discover_users_menu')}
        </h2>
        <ul>
          <li>
            <OptimisticNavLink
              href={buildDiscoverHref({ users: true, q, sort })}
              suppressHydrationWarning
              className={[
                'block rounded-btn px-2 py-1.5 text-body-sm transition-colors',
                usersMode
                  ? 'bg-accent/15 font-weight-label text-accent'
                  : 'text-fg-secondary hover:bg-ghost-surface hover:text-fg',
              ].join(' ')}
              aria-current={usersMode ? 'page' : undefined}
            >
              {t('discover_all_users')}
            </OptimisticNavLink>
          </li>
        </ul>
      </section>
    </aside>
  );
}
