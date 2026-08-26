'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { ProjectedGalleryPhotoView } from '../../domain/object-page.types';
import {
  CONTENT_IMAGE_SKELETON_FRAME_ASPECT,
  resolveContentImageFrameAspect,
} from '../../domain/resolve-gallery-carousel-aspect-ratio';
import { GalleryMediaItem, isGalleryVideoUrl } from './gallery-media-item';

export type ObjectGalleryCarouselProps = {
  photos: ProjectedGalleryPhotoView[];
  onPhotoClick?: (index: number) => void;
  /** Temporary image override (e.g. option hover preview). Does not change carousel index. */
  previewImageUrl?: string | null;
};

const VIDEO_FRAME_ASPECT = 16 / 9;

const CAROUSEL_CONTROL_CLASS =
  'inline-flex w-4 shrink-0 items-center justify-center self-center text-display leading-none text-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const CAROUSEL_CONTROL_DISABLED_CLASS =
  'pointer-events-none opacity-40';

export function ObjectGalleryCarousel({
  photos,
  onPhotoClick,
  previewImageUrl = null,
}: ObjectGalleryCarouselProps) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [frameAspect, setFrameAspect] = useState(CONTENT_IMAGE_SKELETON_FRAME_ASPECT);
  const [isAspectReady, setIsAspectReady] = useState(false);
  const aspectByUrlRef = useRef<Map<string, number>>(new Map());
  const displayUrlRef = useRef<string | undefined>(undefined);

  const count = photos.length;
  const active = photos[activeIndex];
  const activeUrl = active?.url;
  const isPreviewActive = Boolean(previewImageUrl?.trim());
  const displayUrl = previewImageUrl ?? activeUrl;

  displayUrlRef.current = displayUrl;

  useEffect(() => {
    if (activeIndex >= count) {
      setActiveIndex(0);
    }
  }, [activeIndex, count]);

  useEffect(() => {
    if (isPreviewActive || !activeUrl) {
      return;
    }
    if (isGalleryVideoUrl(activeUrl)) {
      setFrameAspect(VIDEO_FRAME_ASPECT);
      setIsAspectReady(true);
      return;
    }
    const cached = aspectByUrlRef.current.get(activeUrl);
    if (cached != null) {
      setFrameAspect(cached);
      setIsAspectReady(true);
      return;
    }
    setFrameAspect(CONTENT_IMAGE_SKELETON_FRAME_ASPECT);
    setIsAspectReady(false);
  }, [activeUrl, isPreviewActive]);

  const handleImageLoad = useCallback(
    (loadedUrl: string, isPreview: boolean) => (event: SyntheticEvent<HTMLImageElement>) => {
      if (isPreview || displayUrlRef.current !== loadedUrl) {
        return;
      }
      const img = event.currentTarget;
      const aspect = resolveContentImageFrameAspect(img.naturalWidth, img.naturalHeight);
      aspectByUrlRef.current.set(loadedUrl, aspect);
      setFrameAspect(aspect);
      setIsAspectReady(true);
    },
    [],
  );

  const goPrev = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (count <= 1 || isPreviewActive) {
        return;
      }
      setActiveIndex((i) => (i - 1 + count) % count);
    },
    [count, isPreviewActive],
  );

  const goNext = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (count <= 1 || isPreviewActive) {
        return;
      }
      setActiveIndex((i) => (i + 1) % count);
    },
    [count, isPreviewActive],
  );

  if (!active || !displayUrl) {
    return null;
  }

  const showControls = count > 1;
  const controlClassName = isPreviewActive
    ? `${CAROUSEL_CONTROL_CLASS} ${CAROUSEL_CONTROL_DISABLED_CLASS}`
    : CAROUSEL_CONTROL_CLASS;
  const frameClassName = [
    'relative min-w-0 flex-1 overflow-hidden rounded-btn border border-border',
    onPhotoClick ? 'cursor-pointer transition-colors hover:border-accent/40' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const isDisplayVideo = displayUrl ? isGalleryVideoUrl(displayUrl) : false;
  const resolvedAspect = isDisplayVideo ? VIDEO_FRAME_ASPECT : frameAspect;
  const showMediaReady = isPreviewActive || isAspectReady || isDisplayVideo;

  const photoFrame = (
    <div
      className="relative w-full"
      style={{ aspectRatio: resolvedAspect }}
      data-testid="gallery-carousel-frame"
    >
      <GalleryMediaItem
        key={displayUrl}
        src={displayUrl}
        imageClassName={[
          'object-contain',
          showMediaReady ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        sizes="(max-width: 768px) 100vw, 320px"
        priority={!isPreviewActive && activeIndex === 0}
        previewOnly
        onImageLoad={handleImageLoad(displayUrl, isPreviewActive)}
      />
    </div>
  );

  return (
    <div className="mt-3 flex items-center gap-0">
      {showControls ? (
        <button
          type="button"
          className={controlClassName}
          aria-label={t('object_detail_gallery_prev')}
          disabled={isPreviewActive}
          onClick={goPrev}
        >
          ‹
        </button>
      ) : null}
      {onPhotoClick ? (
        <button
          type="button"
          className={frameClassName}
          aria-label={t('gallery')}
          onClick={() => onPhotoClick(activeIndex)}
        >
          {photoFrame}
        </button>
      ) : (
        <div className={frameClassName}>{photoFrame}</div>
      )}
      {showControls ? (
        <button
          type="button"
          className={controlClassName}
          aria-label={t('object_detail_gallery_next')}
          disabled={isPreviewActive}
          onClick={goNext}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
