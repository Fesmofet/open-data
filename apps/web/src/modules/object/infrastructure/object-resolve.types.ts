import { z } from 'zod';

import { projectedObjectViewSchema } from '@/modules/feed/application/dto/feed-story.dto';

/** JSON from query-api `POST /query/v1/objects/resolve`. Preserves extra keys (e.g. hoisted `parent`). */
export const projectedObjectWithCountsSchema = projectedObjectViewSchema
  .extend({
    followers_count: z.number().int(),
    experts_count: z.number().int().default(0),
    posts_count: z.number().int().default(0),
    updates_count: z.number().int(),
    favorited_by_count: z.number().int().default(0),
    supervised_count: z.number().int().default(0),
    exclusive_count: z.number().int().default(0),
    isFavorited: z.boolean().optional().default(false),
    hasSupervisedOwnership: z.boolean().optional().default(false),
    hasExclusiveOwnership: z.boolean().optional().default(false),
    is_following: z.boolean().default(false),
    viewer_bell: z.boolean().default(false),
    update_type_counts: z.record(z.string(), z.number().int()).default({}),
    update_locales: z.array(z.string()).default([]),
  })
  .passthrough();

export type ProjectedObjectWithCountsView = z.infer<
  typeof projectedObjectWithCountsSchema
>;
