'use client';

import Image from 'next/image';
import { useEffect, useState, type SyntheticEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { shouldUnoptimizeRemoteImage } from '@/shared/presentation';

import { GalleryImageFailedState } from './gallery-image-failed-state';

export type GalleryImageProps = {
  src: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * Gallery grid / full-view image with a styled fallback when the remote URL fails
 * (CDN 404, hotlink block, expired asset).
 */
export function GalleryImage({
  src,
  className = 'object-cover',
  sizes,
  priority = false,
  onLoad,
}: GalleryImageProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (failed) {
    return <GalleryImageFailedState message={t('gallery_image_failed_to_load')} />;
  }

  return (
    <div className="absolute inset-0">
      {!loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-surface-control"
          aria-hidden
        />
      ) : null}
      <Image
        src={src}
        alt=""
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={shouldUnoptimizeRemoteImage(src)}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
