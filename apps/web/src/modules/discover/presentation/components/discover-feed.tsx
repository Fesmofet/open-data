'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { DiscoverBox, DiscoverMapView } from '../../domain/discover-url';
import { DiscoverActiveChips } from './discover-active-chips';
import { DiscoverMobileHeader } from './discover-mobile-header';
import { DiscoverObjectFeed } from './discover-object-feed';
import { DiscoverSortSelect } from './discover-sort-select';
import { DiscoverUserFeed } from './discover-user-feed';

export type DiscoverFeedProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  map: DiscoverMapView | null;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  showFilters: boolean;
  showMap: boolean;
  showChooseTypePrompt: boolean;
  onOpenTypeSheet: () => void;
  onOpenFilterSheet: () => void;
  onOpenMapSheet: () => void;
};

export function DiscoverFeed({
  usersMode,
  objectType,
  q,
  tags,
  sort,
  box,
  map,
  viewerUsername,
  onRequireLogin,
  showFilters,
  showMap,
  showChooseTypePrompt,
  onOpenTypeSheet,
  onOpenFilterSheet,
  onOpenMapSheet,
}: DiscoverFeedProps) {
  const { t } = useI18n();

  return (
    <main className="min-w-0">
      <DiscoverMobileHeader
        usersMode={usersMode}
        objectType={objectType}
        q={q}
        tags={tags}
        sort={sort}
        box={box}
        map={map}
        showFilters={showFilters}
        showMap={showMap}
        onOpenTypeSheet={onOpenTypeSheet}
        onOpenFilterSheet={onOpenFilterSheet}
        onOpenMapSheet={onOpenMapSheet}
      />

      <div className="mb-4 hidden items-center justify-between gap-3 lg:flex">
        <h1 className="text-heading font-weight-label text-fg">{t('discover_page_title')}</h1>
        {!usersMode ? (
          <DiscoverSortSelect
            usersMode={usersMode}
            objectType={objectType}
            q={q}
            tags={tags}
            sort={sort}
            box={box}
            map={map}
          />
        ) : null}
      </div>

      <div className="hidden lg:block">
        <DiscoverActiveChips
          usersMode={usersMode}
          objectType={objectType}
          q={q}
          tags={tags}
          sort={sort}
          box={box}
          map={map}
        />
      </div>

      {showChooseTypePrompt ? (
        <p className="hidden py-8 text-body text-fg-secondary lg:block">
          {t('discover_choose_type_prompt')}
        </p>
      ) : null}

      {usersMode ? (
        <DiscoverUserFeed q={q} />
      ) : objectType ? (
        <DiscoverObjectFeed
          objectType={objectType}
          q={q}
          tags={tags}
          sort={sort}
          box={box}
          viewerUsername={viewerUsername}
          onRequireLogin={onRequireLogin}
        />
      ) : null}
    </main>
  );
}
