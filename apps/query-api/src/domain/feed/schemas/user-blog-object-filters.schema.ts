import { z } from 'zod';

export const USER_BLOG_OBJECT_FILTERS_MAX = 20;

export const userBlogObjectFiltersQuerySchema = z.object({
  objects: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Active object_id filters (AND semantics)')
    .transform((v) => {
      if (v == null) {
        return [] as string[];
      }
      const arr = Array.isArray(v) ? v : [v];
      return arr.map((s) => s.trim()).filter((s) => s.length > 0);
    }),
});

export type UserBlogObjectFiltersQuery = z.infer<typeof userBlogObjectFiltersQuerySchema>;
