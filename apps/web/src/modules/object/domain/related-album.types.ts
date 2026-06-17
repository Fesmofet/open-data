import { z } from 'zod';

export const relatedAlbumImageSchema = z.object({
  url: z.string(),
  postAuthor: z.string(),
  postPermlink: z.string(),
});

export const relatedAlbumPreviewResponseSchema = z.object({
  count: z.number().int(),
  items: z.array(relatedAlbumImageSchema),
});

export const relatedAlbumListResponseSchema = z.object({
  count: z.number().int(),
  items: z.array(relatedAlbumImageSchema),
  hasMore: z.boolean(),
  cursor: z.string().nullable(),
});

export type RelatedAlbumImageView = z.infer<typeof relatedAlbumImageSchema>;
export type RelatedAlbumPreviewView = z.infer<typeof relatedAlbumPreviewResponseSchema>;
export type RelatedAlbumListView = z.infer<typeof relatedAlbumListResponseSchema>;

export type RelatedAlbumFetchResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'empty'; data: T }
  | { status: 'error' };
