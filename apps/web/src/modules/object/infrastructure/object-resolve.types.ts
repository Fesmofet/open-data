import { z } from 'zod';

import { projectedObjectViewSchema } from '@/modules/feed/application/dto/feed-story.dto';

/** JSON from query-api `POST /query/v1/objects/resolve`. Preserves extra keys (e.g. hoisted `parent`). */
export const projectedObjectWithCountsSchema = projectedObjectViewSchema
  .extend({
    followers_count: z.number().int(),
    experts_count: z.number().int().default(0),
    posts_count: z.number().int().default(0),
    updates_count: z.number().int(),
    administrative_count: z.number().int().default(0),
    ownership_count: z.number().int().default(0),
    is_following: z.boolean().default(false),
    viewer_bell: z.boolean().default(false),
    update_type_counts: z.record(z.string(), z.number().int()).default({}),
    update_locales: z.array(z.string()).default([]),
  })
  .passthrough();

export type ProjectedObjectWithCountsView = z.infer<
  typeof projectedObjectWithCountsSchema
>;
