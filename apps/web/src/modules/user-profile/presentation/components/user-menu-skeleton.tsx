'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS,
  HORIZONTAL_TAB_NAV_SUB_ROW_CLASS,
  horizontalTabNavScrollShellClass,
} from '@/shared/presentation/layout';

import type { UserMenuRows } from './user-menu';
import { getSubmenuVariant } from './user-profile-subnav';
import { useEffectiveProfileNav } from './user-profile-pending-nav-context';

const TAB_SKELETON_CLASS =
  'inline-flex h-10 min-w-[3.5rem] shrink-0 animate-pulse border-b-2 border-transparent px-3 py-2.5';

function NavSkeletonRow({
  rowClass,
  count,
  ariaLabel,
  ariaHidden,
}: {
  rowClass: string;
  count: number;
  ariaLabel?: string;
  ariaHidden?: boolean;
}) {
  return (
    <nav
      className={rowClass}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={TAB_SKELETON_CLASS} />
      ))}
    </nav>
  );
}

function NavSkeletonShell({
  rowClass,
  bleed,
  count,
  ariaLabel,
  ariaHidden,
}: {
  rowClass: string;
  bleed: 'gutter' | 'card';
  count: number;
  ariaLabel?: string;
  ariaHidden?: boolean;
}) {
  return (
    <div className={horizontalTabNavScrollShellClass(bleed)}>
      <NavSkeletonRow
        rowClass={rowClass}
        count={count}
        ariaLabel={ariaLabel}
        ariaHidden={ariaHidden}
      />
    </div>
  );
}

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
      <NavSkeletonShell
        rowClass={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
        bleed="card"
        count={5}
        ariaHidden
      />
    );
  }

  if (rows === 'primary') {
    return (
      <NavSkeletonShell
        rowClass={HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS}
        bleed="gutter"
        count={9}
        ariaLabel={t('user_profile_nav_aria')}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      {showPrimaryRow ? (
        <NavSkeletonShell
          rowClass={HORIZONTAL_TAB_NAV_PRIMARY_ROW_CLASS}
          bleed="gutter"
          count={9}
          ariaLabel={t('user_profile_nav_aria')}
        />
      ) : null}
      {showSubRow ? (
        <NavSkeletonShell
          rowClass={HORIZONTAL_TAB_NAV_SUB_ROW_CLASS}
          bleed="card"
          count={5}
          ariaHidden
        />
      ) : null}
    </div>
  );
}
