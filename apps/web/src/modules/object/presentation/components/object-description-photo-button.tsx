'use client';

import { GalleryImage } from './gallery-image';

const PHOTO_FRAME_CLASS =
  'relative my-4 aspect-[4/3] w-full overflow-hidden rounded-btn border border-border';

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
  const photoFrame = (
    <div className="relative size-full">
      <GalleryImage
        src={url}
        sizes="(max-width: 768px) 100vw, 720px"
        className="pointer-events-none object-cover"
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
