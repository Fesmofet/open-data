import { z } from 'zod';
import { RELATED_ALBUM_PREVIEW_LIMIT } from '@opden-data-layer/core';

const MAX_PAGE = 50;
const DEFAULT_PAGE = 20;

export const relatedAlbumPreviewQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE)
    .default(RELATED_ALBUM_PREVIEW_LIMIT)
    .describe('Preview image count (default 4)'),
});

export const relatedAlbumListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE)
    .default(DEFAULT_PAGE)
    .describe('Page size (max 50)'),
  cursor: z
    .string()
    .optional()
    .describe('Offset cursor from previous page'),
});

export type RelatedAlbumPreviewQuery = z.infer<typeof relatedAlbumPreviewQuerySchema>;
export type RelatedAlbumListQuery = z.infer<typeof relatedAlbumListQuerySchema>;

export type RelatedAlbumImageDto = {
  url: string;
  postAuthor: string;
  postPermlink: string;
};

export type RelatedAlbumPreviewResponseDto = {
  count: number;
  items: RelatedAlbumImageDto[];
};

export type RelatedAlbumListResponseDto = {
  count: number;
  items: RelatedAlbumImageDto[];
  hasMore: boolean;
  cursor: string | null;
};
