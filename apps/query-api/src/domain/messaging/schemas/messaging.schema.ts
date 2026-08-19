import { z } from 'zod';

export const channelListQuerySchema = z.object({
  kind: z.enum(['direct', 'group', 'object']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ChannelListQuery = z.infer<typeof channelListQuerySchema>;

export const messageHistoryBodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  for_context: z.boolean().optional(),
});

export type MessageHistoryBody = z.infer<typeof messageHistoryBodySchema>;

export const markChannelReadBodySchema = z.object({
  last_read_at_unix: z.coerce.number().int(),
});

export type MarkChannelReadBody = z.infer<typeof markChannelReadBodySchema>;
