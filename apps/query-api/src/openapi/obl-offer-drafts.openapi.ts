import { z } from 'zod';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const oblOfferDraftViewSchema = registry.register(
  'OblOfferDraftView',
  z.object({
    draftId: z.string(),
    author: z.string(),
    kind: z.enum(['offer', 'request']),
    fields: z.unknown(),
    legalText: z.string().nullable(),
    lastUpdated: z.number().int(),
  }),
);

const authorParam = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9.-]+$/)
  .openapi({
    param: { name: 'author', in: 'path', required: true },
    example: 'alice',
  });

const bearerSecurity = [{ bearerAuth: [] }];

const unauthorizedSchema = z.object({
  statusCode: z.literal(401),
  message: z.string(),
  error: z.string(),
});

const forbiddenSchema = z.object({
  statusCode: z.literal(403),
  message: z.string(),
  error: z.string(),
});

const notFoundSchema = z.object({
  statusCode: z.literal(404),
  message: z.string(),
  error: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{author}/obl-drafts',
  tags: [queryApiOpenApiTags.oblOfferDrafts],
  summary: 'List OBL offer drafts for the authenticated author',
  security: bearerSecurity,
  request: { params: z.object({ author: authorParam }) },
  responses: {
    200: {
      description: 'Draft list',
      content: { 'application/json': { schema: z.array(oblOfferDraftViewSchema) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: unauthorizedSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: forbiddenSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{author}/obl-drafts/one',
  tags: [queryApiOpenApiTags.oblOfferDrafts],
  summary: 'Get one OBL offer draft',
  security: bearerSecurity,
  request: {
    params: z.object({ author: authorParam }),
    query: z.object({ draftId: z.string().min(1).max(256) }),
  },
  responses: {
    200: {
      description: 'Draft',
      content: { 'application/json': { schema: oblOfferDraftViewSchema } },
    },
    404: { description: 'Not found', content: { 'application/json': { schema: notFoundSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{author}/obl-drafts',
  tags: [queryApiOpenApiTags.oblOfferDrafts],
  summary: 'Create OBL offer draft',
  security: bearerSecurity,
  request: {
    params: z.object({ author: authorParam }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            draftId: z.string().min(1).max(256).optional(),
            kind: z.enum(['offer', 'request']),
            fields: z.record(z.string(), z.unknown()).optional(),
            legalText: z.string().max(65536).nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created draft',
      content: { 'application/json': { schema: oblOfferDraftViewSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/query/v1/users/{author}/obl-drafts',
  tags: [queryApiOpenApiTags.oblOfferDrafts],
  summary: 'Patch OBL offer draft',
  security: bearerSecurity,
  request: {
    params: z.object({ author: authorParam }),
    query: z.object({ draftId: z.string().min(1).max(256) }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            kind: z.enum(['offer', 'request']).optional(),
            fields: z.record(z.string(), z.unknown()).optional(),
            legalText: z.string().max(65536).nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated draft',
      content: { 'application/json': { schema: oblOfferDraftViewSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/query/v1/users/{author}/obl-drafts',
  tags: [queryApiOpenApiTags.oblOfferDrafts],
  summary: 'Delete OBL offer draft',
  security: bearerSecurity,
  request: {
    params: z.object({ author: authorParam }),
    query: z.object({ draftId: z.string().min(1).max(256) }),
  },
  responses: {
    204: { description: 'Deleted' },
  },
});
