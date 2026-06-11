import { z } from 'zod';
import { qsArray, typesArray } from '../categories/categories-query.schema';

export const shopObjectsQuerySchema = z.object({
  types: typesArray.describe('Object types in shop scope (default book, product)'),
  categoryPath: qsArray.describe(
    'AND filter on category_names path segments; empty = all in scope unless uncategorizedOnly',
  ),
  uncategorizedOnly: z.preprocess(
    (v) => v === 'true' || v === true || v === '1' || v === 1,
    z
      .boolean()
      .optional()
      .default(false)
      .describe('When true, only objects with no category_names'),
  ),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe('Page size'),
  cursor: z.string().optional().describe('Opaque cursor (object_id)'),
});

export type ShopObjectsQuery = z.infer<typeof shopObjectsQuerySchema>;

export const shopSectionsQuerySchema = z.object({
  types: typesArray.describe('Object types in shop scope'),
  name: z.string().optional().describe('Parent department name for drill-down (omit at root)'),
  path: qsArray.describe('Ancestor category names before name'),
  cursor: z
    .string()
    .optional()
    .describe('Last category name from previous page (section pagination)'),
  sectionLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('Max category sections per page'),
});

export type ShopSectionsQuery = z.infer<typeof shopSectionsQuerySchema>;
