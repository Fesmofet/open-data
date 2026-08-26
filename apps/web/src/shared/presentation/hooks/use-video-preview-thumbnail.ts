'use client';

import { useEffect, useState } from 'react';

import {
  fetchThreeSpeakThumbnail,
  isBrokenThreeSpeakStaticThumbnail,
  isThreeSpeakEmbedUrl,
  parseThreeSpeakVideoIdFromEmbedUrl,
} from '@/shared/infrastructure/three-speak-preview';

/**
 * Resolves video preview poster: static thumbnail first, then 3Speak play API when needed.
 */
export function useVideoPreviewThumbnail(
  embedUrl: string | null | undefined,
  staticThumbnailUrl: string | null | undefined,
): string | null {
  const staticVideoThumb =
    staticThumbnailUrl && !isBrokenThreeSpeakStaticThumbnail(staticThumbnailUrl)
      ? staticThumbnailUrl
      : null;
  const [fetchedThreeSpeakThumb, setFetchedThreeSpeakThumb] = useState<string | null>(null);
  const threeSpeakVideoId = isThreeSpeakEmbedUrl(embedUrl)
    ? parseThreeSpeakVideoIdFromEmbedUrl(embedUrl ?? '')
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

  return fetchedThreeSpeakThumb ?? staticVideoThumb ?? null;
}
