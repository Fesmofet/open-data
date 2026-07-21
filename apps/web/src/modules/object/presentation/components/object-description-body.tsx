'use client';

import { useCallback, type MouseEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { sanitizePostBodyHtml } from '@/shared/infrastructure/post-body-html-pipeline';

import {
  buildDescriptionPageBlocks,
  splitDescriptionParagraphs,
} from '../../domain/build-description-page-blocks';
import type {
  ProjectedGalleryAlbumView,
  ProjectedGalleryPhotoView,
} from '../../domain/object-page.types';
import { resolveGalleryPhotoIndexByUrl } from '../../domain/resolve-gallery-photos-album';
import {
  OBJECT_PAGE_CONTENT_ARTICLE_CLASS,
  OBJECT_PAGE_CONTENT_BODY_CLASS,
} from '../object-page-content-body.class';
import { ObjectDescriptionPhotoButton } from './object-description-photo-button';

export type ObjectDescriptionBodyProps = {
  descriptionContent: string | null;
  galleryPhotos: ProjectedGalleryPhotoView[];
  galleryPhotosAlbum?: ProjectedGalleryAlbumView | null;
  onOpenGalleryPhoto?: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
};

/** Description page with legacy paragraph/photo interleave; photos open gallery viewer when wired. */
export function ObjectDescriptionBody({
  descriptionContent,
  galleryPhotos,
  galleryPhotosAlbum = null,
  onOpenGalleryPhoto,
}: ObjectDescriptionBodyProps) {
  const { t } = useI18n();
  const paragraphs = descriptionContent
    ? splitDescriptionParagraphs(descriptionContent)
    : [];
  const blocks = buildDescriptionPageBlocks(paragraphs, galleryPhotos);
  const canOpenGallery = galleryPhotosAlbum != null && onOpenGalleryPhoto != null;

  const openPhoto = useCallback(
    (url: string, fallbackIndex: number) => {
      if (!galleryPhotosAlbum || !onOpenGalleryPhoto) {
        return;
      }
      const albumIndex = resolveGalleryPhotoIndexByUrl(galleryPhotosAlbum, url);
      onOpenGalleryPhoto(
        galleryPhotosAlbum,
        albumIndex >= 0 ? albumIndex : fallbackIndex,
      );
    },
    [galleryPhotosAlbum, onOpenGalleryPhoto],
  );

  const handleInlineImageClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!canOpenGallery) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }
      const index = resolveGalleryPhotoIndexByUrl(
        galleryPhotosAlbum!,
        target.currentSrc || target.src,
      );
      if (index < 0) {
        return;
      }
      event.preventDefault();
      onOpenGalleryPhoto!(galleryPhotosAlbum!, index);
    },
    [canOpenGallery, galleryPhotosAlbum, onOpenGalleryPhoto],
  );

  let photoBlockIndex = 0;

  if (blocks.length === 0) {
    return (
      <article className={OBJECT_PAGE_CONTENT_ARTICLE_CLASS}>
        <p className="text-body-sm text-muted">This object has no description yet.</p>
      </article>
    );
  }

  return (
    <article
      className={OBJECT_PAGE_CONTENT_ARTICLE_CLASS}
      onClick={canOpenGallery ? handleInlineImageClick : undefined}
    >
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          const html = sanitizePostBodyHtml(block.html);
          return (
            <div
              key={`p-${index}`}
              className={[
                OBJECT_PAGE_CONTENT_BODY_CLASS,
                canOpenGallery
                  ? '[&_img]:cursor-pointer [&_img]:transition-opacity hover:[&_img]:opacity-90'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        const fallbackIndex = photoBlockIndex;
        photoBlockIndex += 1;

        if (!canOpenGallery) {
          return (
            <ObjectDescriptionPhotoButton
              key={`img-${block.url}-${index}`}
              url={block.url}
              interactive={false}
            />
          );
        }

        return (
          <ObjectDescriptionPhotoButton
            key={`img-${block.url}-${index}`}
            url={block.url}
            interactive
            ariaLabel={t('gallery')}
            onClick={() => openPhoto(block.url, fallbackIndex)}
          />
        );
      })}
    </article>
  );
}
