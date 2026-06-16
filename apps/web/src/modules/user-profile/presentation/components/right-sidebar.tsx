'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import { isUserProfilePostsTab } from '../../domain/profile-post-filters-url';
import { ProfilePostFiltersFromUrl } from './profile-post-filters';

type RightSidebarProps = {
  accountName: string;
};

function FiltersFallback() {
  return (
    <aside
      className="rounded-card border border-border bg-surface/60 p-card-padding"
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
  if (!isUserProfilePostsTab(pathname)) {
    return null;
  }

  return (
    <Suspense fallback={<FiltersFallback />}>
      <ProfilePostFiltersFromUrl accountName={accountName} />
    </Suspense>
  );
}

export function RightSidebar({ accountName }: RightSidebarProps) {
  return <RightSidebarContent accountName={accountName} />;
}
