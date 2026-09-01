'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { OptimisticNavSync, useInstantNavigation } from '@/shared/presentation';
import { useMediaQuery } from '@/shared/presentation/layout';
import { useLoginModal } from '@/modules/auth';

import { parseDiscoverPageState, buildDiscoverHref } from '../../domain/discover-url';
import { objectTypeHasTagCategoryFilters } from '../../domain/discover-registry';
import { resolveInitialDiscoverType } from '../../domain/resolve-initial-discover-type';
import { DiscoverFeed } from './discover-feed';
import { DiscoverFilters } from './discover-filters';
import { DiscoverFilterSheet } from './discover-filter-sheet';
import { DiscoverSidebar } from './discover-sidebar';
import { DiscoverTypeSheet } from './discover-type-sheet';
import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

export type DiscoverPageClientProps = {
  viewerUsername?: string | null;
  rememberedObjectType?: string | null;
};

function DiscoverPageContent({
  viewerUsername = null,
  rememberedObjectType = null,
}: DiscoverPageClientProps) {
  const searchParams = useSearchParams();
  const { isNavigating, navigateInstant } = useInstantNavigation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { usersMode, objectType, q, tags, sort } = useMemo(
    () => parseDiscoverPageState(searchParams),
    [searchParams],
  );
  const { openLogin } = useLoginModal();
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showFilters =
    !usersMode && objectType != null && objectTypeHasTagCategoryFilters(objectType);

  const showChooseTypePrompt =
    !usersMode && objectType == null && isDesktop;

  useEffect(() => {
    if (isDesktop) {
      setTypeSheetOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!mounted || usersMode || objectType != null) {
      return;
    }

    const resolution = resolveInitialDiscoverType({
      objectType,
      usersMode,
      remembered: rememberedObjectType,
    });

    if (resolution.action === 'navigate') {
      const href = buildDiscoverHref({ type: resolution.type, q, sort });
      navigateInstant({ href, method: 'replace', scroll: false });
      return;
    }

    if (resolution.action === 'openTypeSheet' && !isDesktop) {
      setTypeSheetOpen(true);
    }
  }, [
    mounted,
    objectType,
    usersMode,
    rememberedObjectType,
    q,
    sort,
    navigateInstant,
    isDesktop,
  ]);

  const filterObjectType =
    objectType && objectType !== 'all' ? objectType : null;

  return (
    <div className="mx-auto w-full max-w-container-page px-gutter pt-section-y-sm sm:px-gutter-sm">
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
            showFilters={showFilters}
            showChooseTypePrompt={showChooseTypePrompt}
            onOpenTypeSheet={() => setTypeSheetOpen(true)}
            onOpenFilterSheet={() => setFilterSheetOpen(true)}
          />
        </div>
        {showFilters && filterObjectType ? (
          <DiscoverFilters
            objectType={filterObjectType}
            q={q}
            tags={tags}
            sort={sort}
          />
        ) : (
          <div className="hidden min-w-0 self-start lg:block" aria-hidden />
        )}
      </div>

      <DiscoverTypeSheet
        open={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        usersMode={usersMode}
        objectType={objectType}
        q={q}
        sort={sort}
      />

      {filterSheetOpen && filterObjectType ? (
        <DiscoverFilterSheet
          open={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          objectType={filterObjectType}
          q={q}
          tags={tags}
          sort={sort}
        />
      ) : null}
    </div>
  );
}

export function DiscoverPageClient(props: DiscoverPageClientProps) {
  return (
    <>
      <OptimisticNavSync />
      <DiscoverPageContent {...props} />
    </>
  );
}
