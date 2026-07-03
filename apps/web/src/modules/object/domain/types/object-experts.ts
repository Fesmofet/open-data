import { z } from 'zod';

export const objectExpertListItemSchema = z.object({
  name: z.string(),
  avatarUrl: z.string().nullable(),
  objectExpertiseWeight: z.number(),
  usersFollowingCount: z.number(),
  isCurrentFollowing: z.boolean(),
});

export const paginatedObjectExpertListSchema = z.object({
  items: z.array(objectExpertListItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type ObjectExpertListItemView = z.infer<typeof objectExpertListItemSchema>;
export type PaginatedObjectExpertListView = z.infer<typeof paginatedObjectExpertListSchema>;

export type LoadMoreObjectExpertsFn = (
  objectId: string,
  skip: number,
) => Promise<PaginatedObjectExpertListView>;
