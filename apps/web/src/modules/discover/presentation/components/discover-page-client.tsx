'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  InstantNavigationProvider,
  OptimisticNavProvider,
  OptimisticNavSync,
  useInstantNavigation,
} from '@/shared/presentation';
import { useLoginModal } from '@/modules/auth';

import { parseDiscoverPageState } from '../../domain/discover-url';
import { objectTypeHasTagCategoryFilters } from '../../domain/discover-registry';
import { DiscoverFeed } from './discover-feed';
import { DiscoverFilters } from './discover-filters';
import { DiscoverSidebar } from './discover-sidebar';
import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

export type DiscoverPageClientProps = {
  viewerUsername?: string | null;
};

function DiscoverPageContent({ viewerUsername = null }: DiscoverPageClientProps) {
  const searchParams = useSearchParams();
  const { isNavigating } = useInstantNavigation();
  const { usersMode, objectType, q, tags, sort } = useMemo(
    () => parseDiscoverPageState(searchParams),
    [searchParams],
  );
  const { openLogin } = useLoginModal();

  const showFilters =
    !usersMode && objectType != null && objectTypeHasTagCategoryFilters(objectType);

  return (
    <div className="mx-auto w-full max-w-container-page px-gutter sm:px-gutter-sm">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)_minmax(12rem,15rem)]">
        <DiscoverSidebar usersMode={usersMode} objectType={objectType} q={q} sort={sort} />
        <div className="relative z-10 min-w-0">
          {isNavigating ? (
            <div className="mb-4" aria-busy="true" aria-live="polite">
              <ObjectPageCenterSkeleton />
            </div>
          ) : null}
          <DiscoverFeed
            usersMode={usersMode}
            objectType={objectType}
            q={q}
            tags={tags}
            sort={sort}
            viewerUsername={viewerUsername}
            onRequireLogin={openLogin}
          />
        </div>
        {showFilters && objectType ? (
          <DiscoverFilters objectType={objectType} q={q} tags={tags} sort={sort} />
        ) : (
          <div className="hidden min-w-0 self-start lg:block" aria-hidden />
        )}
      </div>
    </div>
  );
}

export function DiscoverPageClient(props: DiscoverPageClientProps) {
  return (
    <OptimisticNavProvider>
      <InstantNavigationProvider>
        <OptimisticNavSync />
        <DiscoverPageContent {...props} />
      </InstantNavigationProvider>
    </OptimisticNavProvider>
  );
}
