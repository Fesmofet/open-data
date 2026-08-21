import { z } from 'zod';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';
import { userCategoriesQuerySchema } from '../domain/categories/categories-query.schema';
import { categoryObjectsQuerySchema } from '../domain/categories/category-objects-query.schema';

const itemSchema = registry.register(
  'CategoryNavItem',
  z.object({
    name: z.string(),
    objects_count: z.number().int().nonnegative(),
    has_children: z.boolean(),
  }),
);

const categoriesResponseSchema = registry.register(
  'UserCategoriesResponse',
  z.object({
    items: z.array(itemSchema),
    uncategorized_count: z.number().int().nonnegative(),
    show_other: z.boolean(),
  }),
);

const badRequestSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
  issues: z.unknown().optional(),
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/categories',
  tags: [queryApiOpenApiTags.users],
  summary: 'Shop departments for a user (authority + optional post-linked scope)',
  description:
    'Returns pre-aggregated categories from `object_categories_related` (`scope_type=user`) keyed by `scope_key=buildUserScopeKey(name, types)` (default types `book`,`product`). Root list when `name` query is omitted; drill-down when `name` and optional `path` are set.',
  request: {
    params: z.object({
      name: z
        .string()
        .min(1)
        .openapi({ param: { name: 'name', in: 'path', required: true } }),
    }),
    query: userCategoriesQuerySchema,
  },
  responses: {
    200: {
      description: 'Shop category navigation slice.',
      content: {
        'application/json': {
          schema: categoriesResponseSchema,
        },
      },
    },
    400: {
      description: 'Query validation failed (Zod).',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
  },
});

const categoryRefListResponseSchema = registry.register(
  'CategoryObjectsResponse',
  z.object({
    items: z.array(
      z.object({
        object_id: z.string(),
        object_type: z.string(),
        fields: z.record(z.string(), z.unknown()),
        weight: z.number().nullable(),
        addedAtUnix: z.number().optional(),
        listItemsCount: z.number().int().optional(),
        isFavorited: z.boolean().optional(),
      }),
    ),
    hasMore: z.boolean(),
    cursor: z.string().nullable(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/categories/objects',
  tags: [queryApiOpenApiTags.categories],
  summary: 'Global objects by department category name',
  description:
    'Returns active objects whose materialized `object_categories.category_names` contain the given name (array overlap). Results are collapsed by `meta_group_id`, ordered by `weight DESC NULLS LAST`, and projected as compact `RefSummary` rows. Keyset cursor encodes weight + object_id.',
  request: {
    query: categoryObjectsQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated category object feed.',
      content: {
        'application/json': {
          schema: categoryRefListResponseSchema,
        },
      },
    },
    400: {
      description: 'Query validation failed (Zod).',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
  },
});
