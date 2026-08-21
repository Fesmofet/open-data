import { z } from 'zod';

const MAX_PAGE = 50;
const DEFAULT_PAGE = 20;

export const userSubscriptionSortSchema = z
  .enum(['rank', 'followers', 'a-z', 'recency'])
  .optional()
  .default('recency');

/** Query for GET followers / GET following lists. */
export const userSocialListQuerySchema = z.object({
  sort: userSubscriptionSortSchema.describe('Sort: rank, followers, a-z, or recency'),
  skip: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Offset for pagination'),
  limit: z.coerce
    .number()
    .int()
    .min(0)
    .max(MAX_PAGE)
    .optional()
    .default(DEFAULT_PAGE)
    .describe('Page size (0 allowed for count-only tab payloads)'),
});

export type UserSocialListQuery = z.infer<typeof userSocialListQuerySchema>;

/** Query for GET object ownership accounts list. */
export const objectOwnershipQuerySchema = userSocialListQuerySchema.extend({
  ownership_type: z
    .enum(['exclusive', 'supervised'])
    .describe('Ownership role filter'),
});

export type ObjectOwnershipQuery = z.infer<typeof objectOwnershipQuerySchema>;

/** Query for GET following-objects list. */
export const userFollowingObjectsQuerySchema = z.object({
  sort: z
    .enum(['weight', 'recency'])
    .optional()
    .default('weight')
    .describe('Sort followed objects by weight or recency'),
  skip: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Offset for pagination'),
  limit: z.coerce
    .number()
    .int()
    .min(0)
    .max(MAX_PAGE)
    .optional()
    .default(DEFAULT_PAGE)
    .describe('Page size (0 for count-only)'),
});

export type UserFollowingObjectsQuery = z.infer<typeof userFollowingObjectsQuerySchema>;
