'use client';

import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { RelatedAlbumListView } from '../../domain/related-album.types';
import type { ProjectedGalleryAlbumView } from '../../domain/object-page.types';
import { fetchObjectRelatedAlbumPageAction } from '../../infrastructure/object-related-album.actions';
import { GalleryPhotoGridSkeleton } from './gallery-skeletons';
import { ObjectRelatedAlbumContent } from './object-related-album-content';

export type ObjectRelatedAlbumSectionProps = {
  objectId: string;
  initialPage: RelatedAlbumListView | null;
  onBackToAlbums: () => void;
  onOpenPhoto?: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
};

export function ObjectRelatedAlbumSection({
  objectId,
  initialPage,
  onBackToAlbums,
  onOpenPhoto,
}: ObjectRelatedAlbumSectionProps) {
  const { t } = useI18n();
  const [page, setPage] = useState<RelatedAlbumListView | null>(initialPage);
  const [loading, setLoading] = useState(initialPage == null);
  const [loadError, setLoadError] = useState(false);

  const loadPage = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    return fetchObjectRelatedAlbumPageAction(objectId).then((result) => {
      if (result.status === 'error') {
        setLoadError(true);
        setPage(null);
      } else {
        setPage(result.data);
      }
      setLoading(false);
    });
  }, [objectId]);

  useEffect(() => {
    if (initialPage != null) {
      setPage(initialPage);
      setLoading(false);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    void loadPage().then(() => {
      if (cancelled) {
        return;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialPage, loadPage]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="self-start text-body-sm font-weight-label text-accent hover:underline"
          onClick={onBackToAlbums}
        >
          {t('back_to_albums')}
        </button>
        <div className="h-7 w-32 animate-pulse rounded-btn bg-surface-control" aria-hidden />
        <GalleryPhotoGridSkeleton count={8} />
      </div>
    );
  }

  if (loadError || page == null) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="self-start text-body-sm font-weight-label text-accent hover:underline"
          onClick={onBackToAlbums}
        >
          {t('back_to_albums')}
        </button>
        <div className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
          <p className="text-fg">{t('gallery_load_failed')}</p>
          <button
            type="button"
            className="mt-3 text-body-sm font-weight-label text-accent hover:underline"
            onClick={() => void loadPage()}
          >
            {t('gallery_try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ObjectRelatedAlbumContent
      objectId={objectId}
      initialPage={page}
      onBackToAlbums={onBackToAlbums}
      onOpenPhoto={onOpenPhoto}
    />
  );
}
