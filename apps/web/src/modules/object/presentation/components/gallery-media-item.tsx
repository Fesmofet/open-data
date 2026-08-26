'use client';

import { type SyntheticEvent } from 'react';

import { parseVideoUrl } from '@/shared/infrastructure/video-preview';
import { VideoPreviewPlayer } from '@/shared/presentation/components/video-preview-player';

import { GalleryImage } from './gallery-image';

export type GalleryMediaItemProps = {
  src: string;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  /** Grid/carousel tile — poster + play badge, no inline playback. */
  previewOnly?: boolean;
  /** Full-screen viewer — inline playback. */
  variant?: 'gallery' | 'viewer';
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onImageLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

export function GalleryMediaItem({
  src,
  sizes,
  priority = false,
  imageClassName = 'object-cover',
  previewOnly = false,
  variant = 'gallery',
  playing,
  onPlayingChange,
  onImageLoad,
}: GalleryMediaItemProps) {
  const videoPreview = parseVideoUrl(src);

  if (videoPreview) {
    return (
      <VideoPreviewPlayer
        source={videoPreview}
        variant={variant}
        previewOnly={previewOnly}
        playing={playing}
        onPlayingChange={onPlayingChange}
        className="size-full"
      />
    );
  }

  return (
    <GalleryImage
      src={src}
      className={imageClassName}
      sizes={sizes}
      priority={priority}
      onLoad={onImageLoad}
    />
  );
}

export function isGalleryVideoUrl(url: string): boolean {
  return parseVideoUrl(url) != null;
}
