'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { shouldUnoptimizeRemoteImage } from '../image/should-unoptimize-remote-image';
import { AVATAR_PLACEHOLDER_SRC, resolveAvatarUrl } from './resolve-avatar-url';

export type UserAvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size: number;
  /** Used for accessible label on the avatar image. */
  displayName?: string;
  className?: string;
  isSquare?: boolean;
};

export function UserAvatar({
  username,
  avatarUrl,
  size,
  displayName,
  className = '',
  isSquare = false,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(false);

  const explicitAvatarUrl = avatarUrl?.trim() ?? '';
  const hasDefaultAvatar = username.trim() !== '';
  const src = resolveAvatarUrl({
    username,
    avatarUrl: useDefaultAvatar ? null : avatarUrl,
    size,
  });
  const label = displayName?.trim() || username;

  useEffect(() => {
    setImageFailed(false);
    setUseDefaultAvatar(false);
  }, [username, avatarUrl, size]);

  const onError = useCallback(() => {
    if (!useDefaultAvatar && explicitAvatarUrl !== '' && hasDefaultAvatar) {
      setUseDefaultAvatar(true);
      return;
    }
    setImageFailed(true);
  }, [explicitAvatarUrl, hasDefaultAvatar, useDefaultAvatar]);

  const showFallback = imageFailed || !src;

  const shapeClass = isSquare ? 'rounded-btn' : 'rounded-circle';

  const frameClass = isSquare
    ? 'self-start shrink-0 bg-surface-alt object-cover shadow-card'
    : 'self-start shrink-0 object-cover shadow-card';

  /** Locks the box in flex layouts: default `align-items: stretch` would vertically stretch the avatar row. */
  const dimensionStyle = {
    width: size,
    minWidth: size,
    height: size,
    minHeight: size,
  } as const;

  const commonClassName = [frameClass, shapeClass, className].filter(Boolean).join(' ');

  if (showFallback) {
    return (
      <Image
        src={AVATAR_PLACEHOLDER_SRC}
        alt={label}
        width={size}
        height={size}
        sizes={`${size}px`}
        className={commonClassName}
        style={dimensionStyle}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={commonClassName}
      style={dimensionStyle}
      unoptimized={shouldUnoptimizeRemoteImage(src)}
      onError={onError}
    />
  );
}
