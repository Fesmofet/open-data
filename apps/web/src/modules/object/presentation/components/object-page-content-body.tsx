'use client';

import { useCallback, useMemo, type MouseEvent } from 'react';

import { sanitizePostBodyHtml } from '@/shared/infrastructure/post-body-html-pipeline';

import { buildPageContentGalleryAlbum } from '../../domain/build-page-content-gallery-album';
import type { ProjectedGalleryAlbumView } from '../../domain/object-page.types';
import { resolveGalleryPhotoIndexByUrl } from '../../domain/resolve-gallery-photos-album';
import {
  OBJECT_PAGE_CONTENT_ARTICLE_CLASS,
  OBJECT_PAGE_CONTENT_BODY_CLASS,
} from '../object-page-content-body.class';

export type ObjectPageContentBodyProps = {
  /** Pre-sanitized HTML (nested resolve / SSR pipeline). */
  html?: string;
  /** Raw page body — sanitized client-side when `html` is omitted. */
  rawContent?: string;
  onOpenGalleryPhoto?: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
};

/** Page-type object body (`pageContent` / nested page HTML) with optional gallery viewer. */
export function ObjectPageContentBody({
  html,
  rawContent,
  onOpenGalleryPhoto,
}: ObjectPageContentBodyProps) {
  const safeHtml = useMemo(() => {
    if (html != null && html.length > 0) {
      return html;
    }
    if (rawContent?.trim()) {
      return sanitizePostBodyHtml(rawContent);
    }
    return '';
  }, [html, rawContent]);

  const pageContentAlbum = useMemo(
    () => (safeHtml ? buildPageContentGalleryAlbum(safeHtml) : null),
    [safeHtml],
  );
  const canOpenGallery = pageContentAlbum != null && onOpenGalleryPhoto != null;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!pageContentAlbum || !onOpenGalleryPhoto) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }
      const index = resolveGalleryPhotoIndexByUrl(
        pageContentAlbum,
        target.currentSrc || target.src,
      );
      if (index < 0) {
        return;
      }
      event.preventDefault();
      onOpenGalleryPhoto(pageContentAlbum, index);
    },
    [onOpenGalleryPhoto, pageContentAlbum],
  );

  if (!safeHtml) {
    return null;
  }

  return (
    <article
      className={OBJECT_PAGE_CONTENT_ARTICLE_CLASS}
      onClick={canOpenGallery ? handleClick : undefined}
    >
      {/* suppressHydrationWarning: browser may normalize serialized HTML vs prop string. */}
      <div
        suppressHydrationWarning
        className={[
          OBJECT_PAGE_CONTENT_BODY_CLASS,
          canOpenGallery
            ? '[&_img]:cursor-pointer [&_img]:transition-opacity hover:[&_img]:opacity-90'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </article>
  );
}

/** @deprecated Use `ObjectPageContentBody`. */
export const ObjectNestedPageBody = ObjectPageContentBody;
export type ObjectNestedPageBodyProps = ObjectPageContentBodyProps;
