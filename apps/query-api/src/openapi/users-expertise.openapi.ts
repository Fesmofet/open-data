import { z } from 'zod';

import { projectedObjectOpenApiSchema } from './projected-object.schema';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';
import { accountNameParam } from './users-social.openapi';

const expertiseProjectedObjectSchema = registry.register(
  'ExpertiseProjectedObject',
  projectedObjectOpenApiSchema.extend({
    user_weight: z.number().openapi({
      description: 'User expertise weight on this object (`user_object_expertise.weight`).',
    }),
  }),
);

const paginatedExpertiseObjectsSchema = registry.register(
  'PaginatedExpertiseObjects',
  z.object({
    items: z.array(expertiseProjectedObjectSchema),
    total: z.number().int(),
    hasMore: z.boolean(),
  }),
);

const userExpertiseCountersSchema = registry.register(
  'UserExpertiseCountersResponse',
  z.object({
    hashtagsCount: z.number().int(),
    objectsCount: z.number().int(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/expertise/counters',
  tags: [queryApiOpenApiTags.users],
  summary: 'Expertise tab counters for a profile',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'Hashtag and object expertise counts (`weight > 0`).',
      content: {
        'application/json': { schema: userExpertiseCountersSchema },
      },
    },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/expertise/objects',
  tags: [queryApiOpenApiTags.users],
  summary: 'Paginated expertise objects for a profile',
  request: {
    params: z.object({ name: accountNameParam }),
    query: z.object({
      scope: z.enum(['hashtags', 'objects']).openapi({
        description: 'Split expertise list by hashtag vs non-hashtag objects.',
      }),
      skip: z.coerce.number().int().min(0).optional().default(0),
      limit: z.coerce.number().int().min(1).max(100).optional().default(30),
    }),
  },
  responses: {
    200: {
      description: 'Objects ordered by `user_weight` descending.',
      content: {
        'application/json': { schema: paginatedExpertiseObjectsSchema },
      },
    },
    404: { description: 'User not found' },
  },
});
