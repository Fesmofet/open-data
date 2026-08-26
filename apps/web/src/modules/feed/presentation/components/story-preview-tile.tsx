'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  getImagePathPost,
  shouldUnoptimizeRemoteImage,
  VideoPreviewPlayer,
} from '@/shared/presentation';

import type { FeedStoryView } from '../../application/dto/feed-story.dto';
import { useStoryPreviewMediaUrl } from '../hooks/use-story-preview-media-url';

export type StoryPreviewTileProps = {
  story: FeedStoryView;
};

function tileLabel(story: FeedStoryView): string {
  if (story.title && story.title.trim().length > 0) {
    return story.title.trim();
  }
  return `Post by @${story.authorName}`;
}

/**
 * Square image-only preview for dense profile grids (e.g. Instagram shell mode).
 */
export function StoryPreviewTile({ story }: StoryPreviewTileProps) {
  const previewMediaUrl = useStoryPreviewMediaUrl(
    story.videoEmbedUrl,
    story.videoThumbnailUrl,
    story.thumbnailUrl,
  );
  const previewMediaDisplayUrl = previewMediaUrl
    ? getImagePathPost(previewMediaUrl)
    : null;
  const label = tileLabel(story);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewMediaUrl]);

  const inner = story.videoEmbedUrl ? (
    <VideoPreviewPlayer
      source={story.videoEmbedUrl}
      staticThumbnailUrl={story.videoThumbnailUrl}
      variant="tile"
    />
  ) : (
    <div className="relative aspect-square w-full overflow-hidden bg-surface-control">
      {previewMediaDisplayUrl && !previewFailed ? (
        <Image
          src={previewMediaDisplayUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
          unoptimized={shouldUnoptimizeRemoteImage(previewMediaDisplayUrl)}
          onError={() => setPreviewFailed(true)}
        />
      ) : previewMediaUrl && previewFailed ? (
        <div
          className="flex h-full w-full items-center justify-center px-2 text-center text-caption text-muted"
          role="status"
        >
          <span className="line-clamp-3">{label}</span>
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-surface-control text-caption text-muted"
          aria-hidden
        >
          <span className="max-w-[90%] truncate px-2 text-center">{label}</span>
        </div>
      )}
    </div>
  );

  if (story.permalinkPath) {
    return (
      <Link
        href={story.permalinkPath}
        className="block min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-label={label}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article className="min-w-0" aria-label={label}>
      {inner}
    </article>
  );
}
