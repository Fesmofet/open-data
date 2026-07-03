import { z } from 'zod';

import { projectedObjectViewSchema } from '@/modules/feed/application/dto/feed-story.dto';

export const expertiseScopeSchema = z.enum(['hashtags', 'objects']);

export type ExpertiseScope = z.infer<typeof expertiseScopeSchema>;

export const expertiseCountersResponseSchema = z.object({
  hashtagsCount: z.number(),
  objectsCount: z.number(),
});

export type ExpertiseCountersResponse = z.infer<typeof expertiseCountersResponseSchema>;

export const expertiseObjectItemSchema = projectedObjectViewSchema.extend({
  user_weight: z.number(),
});

export type ExpertiseObjectItem = z.infer<typeof expertiseObjectItemSchema>;

export const expertiseObjectsPageSchema = z.object({
  items: z.array(expertiseObjectItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type ExpertiseObjectsPage = z.infer<typeof expertiseObjectsPageSchema>;

export const EXPERTISE_PAGE_SIZE = 30;
