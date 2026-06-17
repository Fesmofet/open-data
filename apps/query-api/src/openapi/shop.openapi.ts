import { z } from 'zod';
import { registry } from './registry';

const shopTagCategoryItemSchema = registry.register(
  'UserShopTagCategoryItemDto',
  z.object({
    value: z.string(),
    count: z.number().int(),
  }),
);

const shopTagCategorySectionSchema = registry.register(
  'UserShopTagCategorySectionDto',
  z.object({
    category: z.string(),
    items: z.array(shopTagCategoryItemSchema),
  }),
);

const userShopFiltersResponseSchema = registry.register(
  'UserShopFiltersResponseDto',
  z.object({
    ratings: z.array(z.number().int()).openapi({
      description: 'Static rating thresholds (legacy 10-point scale: 10, 8, 6).',
    }),
    categories: z.array(shopTagCategorySectionSchema),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/shop/filters',
  summary: 'Shop tag and rating filter facets for a user catalog',
  description:
    'Returns tag category facets scoped to the user shop membership (authority ∪ post-linked − deselect) and optional categoryPath. Ratings are static thresholds.',
  request: {
    params: z.object({
      name: z.string().min(1).openapi({ param: { name: 'name', in: 'path', required: true } }),
    }),
    query: z.object({
      types: z.union([z.string(), z.array(z.string())]).optional(),
      categoryPath: z.union([z.string(), z.array(z.string())]).optional(),
      uncategorizedOnly: z.union([z.boolean(), z.string()]).optional(),
      tags: z.union([z.string(), z.array(z.string())]).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Tag facets and rating thresholds for the user shop scope.',
      content: {
        'application/json': {
          schema: userShopFiltersResponseSchema,
        },
      },
    },
  },
});
