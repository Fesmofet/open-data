import { z } from 'zod';

import { VOTERS_PAGE_LIMIT } from '../feed.constants';

export const postVotersQuerySchema = z.object({
  direction: z.enum(['up', 'down']),
  contentType: z.enum(['post', 'thread']).optional().default('post'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(VOTERS_PAGE_LIMIT)
    .optional()
    .default(VOTERS_PAGE_LIMIT),
  cursor: z.string().optional(),
});

export type PostVotersQuery = z.infer<typeof postVotersQuerySchema>;
