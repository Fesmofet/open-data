'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { getSubmenuVariant } from './user-profile-subnav';
import { useUserProfileNav } from './user-profile-nav-context';

/**
 * Placeholder shown while UserMenu loads (client-only to avoid pathname SSR mismatch).
 */
export function UserMenuSkeleton() {
  const { t } = useI18n();
  const { pathname } = useUserProfileNav();
  const showSubRow = Boolean(pathname && getSubmenuVariant(pathname));

  return (
    <div className="border-t border-border pt-3">
      <div className="mx-auto w-fit">
        <nav
          className="flex flex-wrap gap-x-1 gap-y-1 border-b border-border"
          aria-label={t('user_profile_nav_aria')}
          aria-busy="true"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="inline-flex h-10 min-w-[4.5rem] animate-pulse border-b-2 border-transparent px-3 py-2.5"
            />
          ))}
        </nav>
        {showSubRow ? (
          <nav
            className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-b border-border"
            aria-hidden="true"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="inline-flex h-8 min-w-[3.5rem] animate-pulse border-b-2 border-transparent px-2 py-2"
              />
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
