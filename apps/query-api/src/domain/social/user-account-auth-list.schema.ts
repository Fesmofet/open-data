import { z } from 'zod';

const MAX_PAGE = 100;
const DEFAULT_PAGE = 20;

export const hiveAccountAuthorityTypeSchema = z.enum(['owner', 'active', 'posting']);

export const userAccountAuthListQuerySchema = z.object({
  type: hiveAccountAuthorityTypeSchema
    .optional()
    .describe('Filter by authority type; omit for all types'),
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
    .describe('Page size'),
});

export type UserAccountAuthListQuery = z.infer<typeof userAccountAuthListQuerySchema>;
