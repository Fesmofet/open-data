'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getPreviewProxyImageUrl,
  normalizeLegacyObjectImageUrl,
  resolveObjectImageUrl,
} from '../../infrastructure/image/get-proxy-image-url';
import { AVATAR_PLACEHOLDER_SRC } from '../avatar/resolve-avatar-url';
import { shouldUnoptimizeRemoteImage } from '../image/should-unoptimize-remote-image';

type LoadPhase = 'primary' | 'preview' | 'placeholder';

export type ObjectThumbnailProps = {
  src: string | null | undefined;
  alt?: string;
  /** Fixed box size in px (ignored when `fill` is true). */
  size?: number;
  className?: string;
  sizes?: string;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  /** Passed to normalization for steemitimages → Hive avatar mapping. */
  avatarSize?: 'small' | 'large';
};

export function ObjectThumbnail({
  src,
  alt = '',
  size = 40,
  className = '',
  sizes,
  fill = false,
  loading = 'lazy',
  priority = false,
  avatarSize = 'large',
}: ObjectThumbnailProps) {
  const normalizedRaw = useMemo(() => {
    const trimmed = src?.trim();
    return trimmed ? normalizeLegacyObjectImageUrl(trimmed, avatarSize) : '';
  }, [avatarSize, src]);

  const primarySrc = useMemo(
    () => resolveObjectImageUrl(src, avatarSize),
    [avatarSize, src],
  );

  const [phase, setPhase] = useState<LoadPhase>(() =>
    primarySrc ? 'primary' : 'placeholder',
  );

  useEffect(() => {
    setPhase(primarySrc ? 'primary' : 'placeholder');
  }, [primarySrc, src]);

  const displaySrc = useMemo(() => {
    if (phase === 'placeholder') {
      return AVATAR_PLACEHOLDER_SRC;
    }
    if (phase === 'preview' && normalizedRaw) {
      return getPreviewProxyImageUrl(normalizedRaw) || AVATAR_PLACEHOLDER_SRC;
    }
    return primarySrc ?? AVATAR_PLACEHOLDER_SRC;
  }, [normalizedRaw, phase, primarySrc]);

  const onError = useCallback(() => {
    if (phase === 'primary' && normalizedRaw) {
      setPhase('preview');
      return;
    }
    setPhase('placeholder');
  }, [normalizedRaw, phase]);

  const resolvedSizes = sizes ?? (fill ? `${size}px` : `${size}px`);
  const unoptimized =
    displaySrc === AVATAR_PLACEHOLDER_SRC
      ? true
      : shouldUnoptimizeRemoteImage(displaySrc);
  const resolvedLoading = priority ? 'eager' : loading;

  if (fill) {
    return (
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={className}
        sizes={resolvedSizes}
        loading={resolvedLoading}
        priority={priority}
        unoptimized={unoptimized}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      sizes={resolvedSizes}
      loading={resolvedLoading}
      priority={priority}
      unoptimized={unoptimized}
      onError={onError}
    />
  );
}
