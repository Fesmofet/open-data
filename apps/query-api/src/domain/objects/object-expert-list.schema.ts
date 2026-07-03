import { z } from 'zod';

const MAX_PAGE = 50;
const DEFAULT_PAGE = 20;

/** Query for GET object experts list. */
export const objectExpertListQuerySchema = z.object({
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

export type ObjectExpertListQuery = z.infer<typeof objectExpertListQuerySchema>;
