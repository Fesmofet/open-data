import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import { z } from 'zod';

export const homeFeedBodySchema = z.preprocess(
  (data) => (data === undefined || data === null ? {} : data),
  z.object({
    limit: z.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional().default('USD'),
  }),
);

export type HomeFeedBody = z.infer<typeof homeFeedBodySchema>;
