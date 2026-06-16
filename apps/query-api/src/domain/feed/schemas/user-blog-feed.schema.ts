import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import { z } from 'zod';

export const userBlogFeedBodySchema = z.preprocess(
  (data) => (data === undefined || data === null ? {} : data),
  z.object({
    limit: z.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional().default('USD'),
    object_ids: z
      .array(z.string().min(1))
      .max(20)
      .optional()
      .default([]),
  }),
);

export type UserBlogFeedBody = z.infer<typeof userBlogFeedBodySchema>;
