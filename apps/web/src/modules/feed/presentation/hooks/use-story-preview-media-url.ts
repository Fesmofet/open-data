'use client';

import { useVideoPreviewThumbnail } from '@/shared/presentation/hooks/use-video-preview-thumbnail';

/**
 * Feed card preview image: static API fields, with 3Speak posters from play API when needed.
 */
export function useStoryPreviewMediaUrl(
  videoEmbedUrl: string | null | undefined,
  videoThumbnailUrl: string | null | undefined,
  thumbnailUrl: string | null | undefined,
): string | null {
  const videoThumb = useVideoPreviewThumbnail(videoEmbedUrl, videoThumbnailUrl);
  return videoThumb ?? thumbnailUrl ?? null;
}
