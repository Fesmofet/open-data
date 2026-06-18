'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import { ActivityFiltersFromUrl } from '@/modules/user-activity/presentation/components/activity-filters';
import { isUserProfileActivityTab } from '@/modules/user-activity/domain/activity-filters-url';
import { PROFILE_FILTER_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';
import { isUserProfilePostsTab } from '../../domain/profile-post-filters-url';
import { isUserProfileShopOrRecipeTab } from '../../domain/profile-shop-filters-url';
import { ProfilePostFiltersFromUrl } from './profile-post-filters';
import { ProfileShopFiltersFromUrl } from './profile-shop-filters';

type RightSidebarProps = {
  accountName: string;
};

function FiltersFallback() {
  return (
    <aside
      className={[
        PROFILE_FILTER_RAIL_STICKY_CLASS,
        'rounded-card border border-border bg-surface/60 p-card-padding',
      ].join(' ')}
      aria-hidden
    >
      <div className="h-6 w-32 animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded-btn bg-surface-control" />
        ))}
      </div>
    </aside>
  );
}

function RightSidebarContent({ accountName }: RightSidebarProps) {
  const pathname = usePathname();
  if (isUserProfilePostsTab(pathname)) {
    return (
      <Suspense fallback={<FiltersFallback />}>
        <ProfilePostFiltersFromUrl accountName={accountName} />
      </Suspense>
    );
  }

  if (isUserProfileShopOrRecipeTab(pathname)) {
    return (
      <Suspense fallback={<FiltersFallback />}>
        <ProfileShopFiltersFromUrl accountName={accountName} />
      </Suspense>
    );
  }

  if (isUserProfileActivityTab(pathname)) {
    return (
      <Suspense fallback={<FiltersFallback />}>
        <ActivityFiltersFromUrl accountName={accountName} />
      </Suspense>
    );
  }

  return null;
}

export function RightSidebar({ accountName }: RightSidebarProps) {
  return <RightSidebarContent accountName={accountName} />;
}
