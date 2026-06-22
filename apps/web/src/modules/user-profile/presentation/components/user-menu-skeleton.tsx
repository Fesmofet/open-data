'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { UserMenuRows } from './user-menu';
import { getSubmenuVariant } from './user-profile-subnav';
import { useEffectiveProfileNav } from './user-profile-pending-nav-context';

const PRIMARY_NAV_SKELETON_CLASS =
  'flex flex-wrap items-end gap-x-2 gap-y-1';

const SUB_NAV_SKELETON_CLASS =
  'flex flex-wrap items-end gap-x-2 gap-y-1 border-b border-border';

const TAB_SKELETON_CLASS =
  'inline-flex h-10 min-w-[3.5rem] animate-pulse border-b-2 border-transparent px-3 py-2.5';

/**
 * Placeholder shown while UserMenu loads (client-only to avoid pathname SSR mismatch).
 */
export function UserMenuSkeleton({ rows = 'all' }: { rows?: UserMenuRows }) {
  const { t } = useI18n();
  const { pathname } = useEffectiveProfileNav();
  const showSubRow =
    (rows === 'submenu' || rows === 'all') &&
    Boolean(pathname && getSubmenuVariant(pathname));
  const showPrimaryRow = rows === 'primary' || rows === 'all';

  if (rows === 'submenu') {
    if (!showSubRow) {
      return null;
    }
    return (
      <nav className={SUB_NAV_SKELETON_CLASS} aria-hidden="true" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={TAB_SKELETON_CLASS} />
        ))}
      </nav>
    );
  }

  if (rows === 'primary') {
    return (
      <nav
        className={PRIMARY_NAV_SKELETON_CLASS}
        aria-label={t('user_profile_nav_aria')}
        aria-busy="true"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={TAB_SKELETON_CLASS} />
        ))}
      </nav>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      {showPrimaryRow ? (
        <nav
          className={PRIMARY_NAV_SKELETON_CLASS}
          aria-label={t('user_profile_nav_aria')}
          aria-busy="true"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={TAB_SKELETON_CLASS} />
          ))}
        </nav>
      ) : null}
      {showSubRow ? (
        <nav className={SUB_NAV_SKELETON_CLASS} aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={TAB_SKELETON_CLASS} />
          ))}
        </nav>
      ) : null}
    </div>
  );
}
