'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  getImagePathPost,
  getPreviewProxyImageUrl,
} from '@/shared/infrastructure/image/get-proxy-image-url';

import { GalleryImageFailedState } from './gallery-image-failed-state';

type LoadPhase = 'primary' | 'raw' | 'preview' | 'failed';

function normalizeGallerySourceUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

export type GalleryImageProps = {
  src: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * Gallery grid / full-view image with Hive UGC proxy and a styled fallback when
 * the remote URL fails (CDN 404, hotlink block, expired asset).
 *
 * Fallback chain (legacy body `data-fallback-src` + Photos album raw URLs):
 * proxied primary → raw canonical URL → legacy preview proxy → failed state.
 */
export function GalleryImage({
  src,
  className = 'object-cover',
  sizes,
  priority = false,
  onLoad,
}: GalleryImageProps) {
  const { t } = useI18n();
  const rawSrc = useMemo(() => normalizeGallerySourceUrl(src), [src]);

  const primarySrc = useMemo(
    () => (rawSrc ? getImagePathPost(rawSrc) : ''),
    [rawSrc],
  );

  const usesRawFallback = rawSrc !== primarySrc;

  const [phase, setPhase] = useState<LoadPhase>(() =>
    primarySrc ? 'primary' : 'failed',
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPhase(primarySrc ? 'primary' : 'failed');
    setLoaded(false);
  }, [primarySrc, rawSrc]);

  const displaySrc = useMemo(() => {
    if (phase === 'raw') {
      return rawSrc;
    }
    if (phase === 'preview' && rawSrc) {
      return getPreviewProxyImageUrl(rawSrc) || rawSrc;
    }
    return primarySrc;
  }, [phase, primarySrc, rawSrc]);

  const onError = useCallback(() => {
    if (phase === 'primary') {
      setPhase(usesRawFallback ? 'raw' : 'preview');
      setLoaded(false);
      return;
    }
    if (phase === 'raw') {
      setPhase('preview');
      setLoaded(false);
      return;
    }
    setPhase('failed');
  }, [phase, usesRawFallback]);

  if (phase === 'failed' || !displaySrc) {
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
        src={displaySrc}
        alt=""
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized
        onLoad={(event) => {
          onLoad?.(event);
          setLoaded(true);
        }}
        onError={onError}
      />
    </div>
  );
}
