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

type LoadPhase = 'raw' | 'proxy' | 'preview' | 'failed';

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
 * Gallery grid / full-view image with raw-first loading and Hive UGC proxy fallbacks.
 *
 * Fallback chain: normalized raw URL → Hive `0x0` proxy → legacy preview proxy → failed state.
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

  const proxySrc = useMemo(
    () => (rawSrc ? getImagePathPost(rawSrc) : ''),
    [rawSrc],
  );

  const hasProxyFallback = Boolean(rawSrc && proxySrc && proxySrc !== rawSrc);

  const [phase, setPhase] = useState<LoadPhase>(() => (rawSrc ? 'raw' : 'failed'));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPhase(rawSrc ? 'raw' : 'failed');
    setLoaded(false);
  }, [rawSrc, src]);

  const displaySrc = useMemo(() => {
    if (phase === 'raw') {
      return rawSrc;
    }
    if (phase === 'proxy') {
      return proxySrc;
    }
    if (phase === 'preview' && rawSrc) {
      return getPreviewProxyImageUrl(rawSrc) || rawSrc;
    }
    return rawSrc;
  }, [phase, proxySrc, rawSrc]);

  const onError = useCallback(() => {
    if (phase === 'raw') {
      setPhase(hasProxyFallback ? 'proxy' : 'preview');
      setLoaded(false);
      return;
    }
    if (phase === 'proxy') {
      setPhase('preview');
      setLoaded(false);
      return;
    }
    setPhase('failed');
  }, [hasProxyFallback, phase]);

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
