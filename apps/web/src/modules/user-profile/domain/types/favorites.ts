import { z } from 'zod';

import { projectedObjectViewSchema } from '@/modules/feed/application/dto/feed-story.dto';

export const favoritesTypesResponseSchema = z.object({
  types: z.array(z.string()),
});

export type FavoritesTypesResponse = z.infer<typeof favoritesTypesResponseSchema>;

export const favoritesObjectsPageSchema = z.object({
  items: z.array(projectedObjectViewSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type FavoritesObjectsPage = z.infer<typeof favoritesObjectsPageSchema>;

export const FAVORITES_PAGE_SIZE = 20;
