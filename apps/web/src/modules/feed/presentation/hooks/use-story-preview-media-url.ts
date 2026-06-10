'use client';

import { useEffect, useState } from 'react';

import {
  fetchThreeSpeakThumbnail,
  isBrokenThreeSpeakStaticThumbnail,
  isThreeSpeakEmbedUrl,
  parseThreeSpeakVideoIdFromEmbedUrl,
} from '@/shared/infrastructure/three-speak-preview';

/**
 * Resolves feed card preview image: static API fields, with 3Speak posters from play API when needed.
 */
export function useStoryPreviewMediaUrl(
  videoEmbedUrl: string | null | undefined,
  videoThumbnailUrl: string | null | undefined,
  thumbnailUrl: string | null | undefined,
): string | null {
  const staticVideoThumb =
    videoThumbnailUrl && !isBrokenThreeSpeakStaticThumbnail(videoThumbnailUrl)
      ? videoThumbnailUrl
      : null;
  const [fetchedThreeSpeakThumb, setFetchedThreeSpeakThumb] = useState<string | null>(null);
  const threeSpeakVideoId = isThreeSpeakEmbedUrl(videoEmbedUrl)
    ? parseThreeSpeakVideoIdFromEmbedUrl(videoEmbedUrl ?? '')
    : null;

  useEffect(() => {
    setFetchedThreeSpeakThumb(null);
    if (!threeSpeakVideoId || staticVideoThumb) {
      return undefined;
    }
    let cancelled = false;
    void fetchThreeSpeakThumbnail(threeSpeakVideoId).then((url) => {
      if (!cancelled) {
        setFetchedThreeSpeakThumb(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [threeSpeakVideoId, staticVideoThumb]);

  return fetchedThreeSpeakThumb ?? staticVideoThumb ?? thumbnailUrl ?? null;
}
