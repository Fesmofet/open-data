'use client';

import { useCallback, useMemo, useTransition } from 'react';

import { RELATED_ALBUM_NAME } from '@opden-data-layer/core/post-related-images';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  useInfiniteScroll,
  useSyncedPaginatedList,
} from '@/shared/presentation';

import type {
  RelatedAlbumImageView,
  RelatedAlbumListView,
} from '../../domain/related-album.types';
import type { ProjectedGalleryAlbumView, ProjectedGalleryPhotoView } from '../../domain/object-page.types';
import { GalleryImage } from './gallery-image';
import { GalleryPhotoSkeleton } from './gallery-skeletons';
import { loadMoreObjectRelatedAlbumAction } from '../../infrastructure/object-related-album.actions';

export type ObjectRelatedAlbumContentProps = {
  objectId: string;
  initialPage: RelatedAlbumListView;
  onBackToAlbums: () => void;
  onOpenPhoto?: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
};

function toGalleryPhotos(items: readonly RelatedAlbumImageView[]): ProjectedGalleryPhotoView[] {
  return items.map((item) => ({
    url: item.url,
    rankScore: null,
    isAvatar: false,
    postAuthor: item.postAuthor,
    postPermlink: item.postPermlink,
  }));
}

export function ObjectRelatedAlbumContent({
  objectId,
  initialPage,
  onBackToAlbums,
  onOpenPhoto,
}: ObjectRelatedAlbumContentProps) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const initialPageSeed = useMemo(
    () => ({
      items: initialPage.items,
      hasMore: initialPage.hasMore,
      cursor: initialPage.cursor,
    }),
    [initialPage],
  );
  const { items, hasMore, cursor, setItems, setHasMore, setCursor } =
    useSyncedPaginatedList(initialPageSeed);

  const albumView = useMemo<ProjectedGalleryAlbumView>(
    () => ({
      name: RELATED_ALBUM_NAME,
      items: toGalleryPhotos(items),
    }),
    [items],
  );

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreObjectRelatedAlbumAction(objectId, cursor);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
      setCursor(next.cursor);
    });
  }, [
    cursor,
    hasMore,
    objectId,
    pending,
    setCursor,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-body-sm font-weight-label text-accent hover:underline"
          onClick={onBackToAlbums}
        >
          {t('back_to_albums')}
        </button>
      </div>

      <h2 className="text-section font-display text-heading">
        {t('related')} ({initialPage.count})
      </h2>

      {items.length === 0 ? (
        <div className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
          <p>{t('gallery_list_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {items.map((photo, index) => (
            <button
              key={`${photo.url}-${photo.postAuthor}-${photo.postPermlink}-${index}`}
              type="button"
              className="relative aspect-square overflow-hidden rounded-btn border border-border bg-surface/60 hover:border-accent/40"
              onClick={() => onOpenPhoto?.(albumView, index)}
            >
              <GalleryImage
                src={photo.url}
                sizes="(max-width: 768px) 50vw, 320px"
              />
            </button>
          ))}
          {pending
            ? Array.from({ length: 4 }).map((_, index) => (
                <GalleryPhotoSkeleton key={`load-more-skeleton-${index}`} />
              ))
            : null}
        </div>
      )}

      <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
      <button
        type="button"
        className="sr-only"
        disabled={!hasMore || pending}
        onClick={onLoadMore}
      >
        {t('load_more')}
      </button>
    </div>
  );
}
