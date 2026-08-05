/**
 * Route-level loading skeletons for profile pages.
 * Server/route `loading.tsx` only — do not import from client components
 * (pulls feed skeletons; use profile-map-sidebar-list-skeleton.tsx on the client).
 */
import { FeedColumn } from '@/shared/presentation/layout';
import { FeedListSkeleton } from '@/modules/feed/presentation/components/feed-skeletons';

import { ProfileMapSidebarListSkeleton } from './profile-map-sidebar-list-skeleton';

export function ProfileSocialListSkeleton() {
  return (
    <div
      className="min-w-0 pb-section-y"
      aria-busy="true"
      aria-label="Loading social list"
    >
      <ul className="divide-y divide-border" role="list">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <div className="size-12 shrink-0 animate-pulse rounded-circle bg-surface-control" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 max-w-[8rem] animate-pulse rounded-btn bg-surface-control" />
              <div className="h-3 max-w-[12rem] animate-pulse rounded-btn bg-surface-control" />
            </div>
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-btn bg-surface-control" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileObjectCardRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface/80 p-3 shadow-whisper sm:flex-row sm:p-card-padding">
      <div className="aspect-[4/3] w-full animate-pulse rounded-btn bg-surface-control sm:aspect-auto sm:size-24 sm:shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 max-w-[85%] animate-pulse rounded-btn bg-surface-control sm:max-w-[70%]" />
        <div className="h-3 max-w-[60%] animate-pulse rounded-btn bg-surface-control sm:max-w-[45%]" />
        <div className="h-3 w-full animate-pulse rounded-btn bg-surface-control" />
        <div className="h-3 max-w-[90%] animate-pulse rounded-btn bg-surface-control sm:max-w-[85%]" />
      </div>
    </div>
  );
}

export function ProfileObjectListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading objects">
      <FeedColumn>
        <ul className="flex list-none flex-col gap-card-padding p-0">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <ProfileObjectCardRowSkeleton />
            </li>
          ))}
        </ul>
      </FeedColumn>
    </div>
  );
}

export function ProfileShopContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading shop">
      <div className="mb-card-padding flex flex-wrap gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-pill bg-surface-control"
          />
        ))}
      </div>
      <div className="space-y-section-y">
        {Array.from({ length: 2 }, (_, section) => (
          <section key={section} className="space-y-3">
            <div className="h-5 max-w-[10rem] animate-pulse rounded-btn bg-surface-control" />
            <ul className="flex list-none flex-col gap-card-padding p-0">
              {Array.from({ length: 2 }, (_, i) => (
                <li key={i}>
                  <ProfileObjectCardRowSkeleton />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ProfileSectionSkeleton() {
  return (
    <section
      className="rounded-card border border-border bg-surface/80 p-card-padding"
      aria-busy="true"
      aria-label="Loading section"
    >
      <div className="h-6 max-w-[12rem] animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded-btn bg-surface-control" />
        <div className="h-4 max-w-[85%] animate-pulse rounded-btn bg-surface-control" />
        <div className="h-4 max-w-[70%] animate-pulse rounded-btn bg-surface-control" />
      </div>
    </section>
  );
}

export function ProfileMapSkeleton() {
  return (
    <div
      className="flex h-[calc(100vh-14rem)] min-h-0 flex-col overflow-hidden lg:flex-row"
      aria-busy="true"
      aria-label="Loading map"
    >
      <aside className="flex max-h-[40vh] min-h-0 shrink-0 flex-col overflow-hidden border-border lg:h-full lg:max-h-full lg:w-[38%] lg:max-w-xl lg:shrink-0 lg:border-r">
        <ProfileMapSidebarListSkeleton />
      </aside>
      <div className="h-full min-h-0 flex-1 animate-pulse bg-surface-control max-lg:min-h-[240px]" />
    </div>
  );
}

export function ProfileCategoryNavSkeleton() {
  return (
    <nav
      className="rounded-card border border-border bg-surface/60 p-card-padding"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <div className="mb-3 h-4 max-w-[6rem] animate-pulse rounded-btn bg-surface-control" />
      <ul className="list-none space-y-1 p-0">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <div className="h-9 w-full animate-pulse rounded-btn bg-surface-control" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Neutral left-rail placeholder (Discover / non-shop routes). */
export function ProfileLeftRailSkeleton() {
  return (
    <aside
      className="rounded-card bg-surface-alt p-card-padding"
      aria-busy="true"
      aria-label="Loading sidebar"
    >
      <div className="h-5 max-w-[10rem] animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-5 shrink-0 animate-pulse rounded-btn bg-surface-control" />
            <div className="h-3 min-w-0 flex-1 max-w-[85%] animate-pulse rounded-btn bg-surface-control" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-[0.875rem] w-[0.875rem] shrink-0 animate-pulse rounded-btn bg-surface-control" />
            <div className="h-3.5 w-16 animate-pulse rounded-btn bg-surface-control" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-4 max-w-[6rem] animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-2 space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-5 shrink-0 animate-pulse rounded-btn bg-surface-control" />
            <div className="h-3 min-w-0 flex-1 max-w-[80%] animate-pulse rounded-btn bg-surface-control" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-4 max-w-[6rem] animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-2 space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-5 shrink-0 animate-pulse rounded-btn bg-surface-control" />
            <div className="h-3 min-w-0 flex-1 max-w-[75%] animate-pulse rounded-btn bg-surface-control" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ProfileFavoritesTypeNavSkeleton() {
  return (
    <nav
      className="rounded-card border border-border bg-surface/60 p-card-padding"
      aria-busy="true"
      aria-label="Loading favorites types"
    >
      <div className="mb-3 h-4 max-w-[5rem] animate-pulse rounded-btn bg-surface-control" />
      <ul className="list-none space-y-1 p-0">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i}>
            <div className="h-8 w-full animate-pulse rounded-btn bg-surface-control" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ProfileReblogsFeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading reblogs">
      <FeedColumn>
        <FeedListSkeleton count={4} />
      </FeedColumn>
    </div>
  );
}
