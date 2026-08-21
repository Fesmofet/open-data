import { z } from 'zod';

export const feedUnreadCountsResponseSchema = z.object({
  posts: z.number().int().nonnegative(),
  threads: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
});

export type FeedUnreadCountsResponse = z.infer<typeof feedUnreadCountsResponseSchema>;

export const markProfileFeedReadBodySchema = z.object({
  tab: z.enum(['posts', 'threads', 'messages']),
  read_at_unix: z.number().int().nonnegative(),
});

export type MarkProfileFeedReadBody = z.infer<typeof markProfileFeedReadBodySchema>;

export const markProfileFeedReadResponseSchema = z.object({
  updated: z.boolean(),
  read_at_unix: z.number().int().nonnegative(),
});

export type MarkProfileFeedReadResponse = z.infer<
  typeof markProfileFeedReadResponseSchema
>;
