import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe('Search query (predictive header search)'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('Max results per section (default 10)'),
  type: z
    .enum(['all', 'objects', 'users'])
    .default('all')
    .describe('Restrict results to objects, users, or both'),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
