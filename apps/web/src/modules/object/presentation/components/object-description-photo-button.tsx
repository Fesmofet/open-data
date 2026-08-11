'use client';

import { useCallback, useState, type SyntheticEvent } from 'react';

import {
  CONTENT_IMAGE_SKELETON_FRAME_ASPECT,
  resolveContentImageFrameAspect,
} from '../../domain/resolve-gallery-carousel-aspect-ratio';
import { GalleryImage } from './gallery-image';

const PHOTO_FRAME_CLASS =
  'relative my-4 w-full overflow-hidden rounded-btn border border-border';

export type ObjectDescriptionPhotoButtonProps = {
  url: string;
  interactive: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

export function ObjectDescriptionPhotoButton({
  url,
  interactive,
  ariaLabel,
  onClick,
}: ObjectDescriptionPhotoButtonProps) {
  const [frameAspect, setFrameAspect] = useState(CONTENT_IMAGE_SKELETON_FRAME_ASPECT);
  const [isAspectReady, setIsAspectReady] = useState(false);

  const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setFrameAspect(
      resolveContentImageFrameAspect(img.naturalWidth, img.naturalHeight),
    );
    setIsAspectReady(true);
  }, []);

  const photoFrame = (
    <div
      className="relative w-full"
      style={{ aspectRatio: frameAspect }}
      data-testid="description-photo-frame"
    >
      <GalleryImage
        src={url}
        sizes="(max-width: 768px) 100vw, 720px"
        className={[
          'pointer-events-none object-contain',
          isAspectReady ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onLoad={handleImageLoad}
      />
    </div>
  );

  if (!interactive) {
    return <div className={PHOTO_FRAME_CLASS}>{photoFrame}</div>;
  }

  return (
    <button
      type="button"
      className={`${PHOTO_FRAME_CLASS} block w-full cursor-pointer transition-colors hover:border-accent/40`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {photoFrame}
    </button>
  );
}
