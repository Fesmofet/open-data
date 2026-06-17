import { z } from 'zod';

import { projectedObjectOpenApiSchema } from './projected-object.schema';
import { registry } from './registry';
import { accountNameParam, paginatedProjectedObjectsSchema } from './users-social.openapi';

const favoritesLocaleHeader = z.string().optional().openapi({
  description: 'Preferred locale (first BCP-47 tag is used).',
});

const favoritesViewerHeader = z.string().optional().openapi({
  description:
    'Hive account name of the authenticated viewer. Populates per-object viewer fields on projected objects.',
});

const userFavoritesTypesResponseSchema = registry.register(
  'UserFavoritesTypesResponse',
  z.object({
    types: z
      .array(z.string())
      .openapi({ description: 'Object types present in favorites, sorted by count descending.' }),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/favorites/types',
  summary: 'List object types in user favorites',
  description:
    'Distinct `object_type` values from favorites scope (administrative authority ∪ post-linked), sorted by count descending. Returns `{ types: [] }` for unknown or blank account names (no 404).',
  request: {
    params: z.object({ name: accountNameParam }),
    headers: z.object({
      'accept-language': favoritesLocaleHeader,
      'x-locale': favoritesLocaleHeader,
      'x-viewer': favoritesViewerHeader,
    }),
  },
  responses: {
    200: {
      description: 'Type list for sidebar navigation.',
      content: { 'application/json': { schema: userFavoritesTypesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/favorites',
  summary: 'List user favorite objects',
  description:
    'Paginated favorites: `object_authority` (administrative) ∪ optional `post_objects`, filtered by `FAVORITES_OBJECT_TYPES`, `user_shop_deselect`, and `hide_favorite_objects`. Unknown account names return an empty page (`items: []`, `total: 0`) rather than 404. Blank `name` returns `null` body.',
  request: {
    params: z.object({ name: accountNameParam }),
    headers: z.object({
      'accept-language': favoritesLocaleHeader,
      'x-locale': favoritesLocaleHeader,
      'x-viewer': favoritesViewerHeader,
    }),
    query: z.object({
      objectType: z.string().min(1).optional().openapi({
        description: 'Filter to one object type (must be in favorites types list).',
      }),
      skip: z.coerce.number().int().min(0).optional().openapi({ description: 'Pagination offset.' }),
      limit: z.coerce
        .number()
        .int()
        .min(0)
        .max(50)
        .optional()
        .openapi({ description: 'Page size.' }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated projected objects.',
      content: { 'application/json': { schema: paginatedProjectedObjectsSchema } },
    },
  },
});

export { userFavoritesTypesResponseSchema };
