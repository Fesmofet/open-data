import { z } from 'zod';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const oblOfferSchema = registry.register(
  'OblOffer',
  z.object({
    offer_id: z.string(),
    version: z.number().int(),
    kind: z.enum(['offer', 'request']),
    author: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    tags: z.array(z.string()),
    service_ref: z.string().nullable(),
    legal_ref: z.string().nullable(),
    terms: z.unknown(),
    dispute_rule: z.enum(['client', 'provider', 'arbiter']),
    arbiter: z.string().nullable(),
    status: z.enum(['active', 'retired']),
    created_event_seq: z.string(),
    transaction_id: z.string(),
  }),
);

const pairBalanceSchema = registry.register(
  'OblPairBalance',
  z.object({
    accountA: z.string(),
    accountB: z.string(),
    confirmed: z.object({
      owesAtoB: z.string(),
      owesBtoA: z.string(),
      netUsd: z.string(),
    }),
    pending: z.object({
      owesAtoB: z.string(),
      owesBtoA: z.string(),
      netUsd: z.string(),
    }),
    disputed: z.object({
      owesAtoB: z.string(),
      owesBtoA: z.string(),
      netUsd: z.string(),
    }),
  }),
);

const oblLedgerResponseSchema = registry.register(
  'OblLedgerResponse',
  z.object({
    accountA: z.string(),
    accountB: z.string(),
    startedEventSeq: z.string().nullable(),
    contracts: z.array(z.unknown()),
    invoices: z.array(z.unknown()),
    payments: z.array(z.unknown()),
    disputes: z.array(z.unknown()),
    balance: pairBalanceSchema,
  }),
);

const usdToWaivResponseSchema = registry.register(
  'OblUsdToWaivResponse',
  z.object({
    amountUsd: z.number(),
    rateUsd: z.number().nullable(),
    amountWaiv: z.number().nullable(),
  }),
);

const notFoundSchema = z.object({
  statusCode: z.literal(404),
  message: z.string(),
  error: z.string(),
});

const badRequestSchema = z.object({
  statusCode: z.literal(400),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/offers/search',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Search published OBL offers and requests',
  request: {
    query: z.object({
      q: z.string().optional(),
      kind: z.enum(['offer', 'request']).optional(),
      tags: z.string().optional().describe('Comma-separated tags (AND)'),
      author: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Latest active version per offer_id',
      content: { 'application/json': { schema: z.array(oblOfferSchema) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/offers/{offerId}',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Get one OBL offer by id',
  request: {
    params: z.object({ offerId: z.string() }),
    query: z.object({ version: z.coerce.number().int().positive().optional() }),
  },
  responses: {
    200: {
      description: 'Offer row',
      content: { 'application/json': { schema: oblOfferSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/ledger',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Mutual Ledger drill-down for an account pair',
  request: {
    query: z.object({
      accountA: z.string().min(1).max(32),
      accountB: z.string().min(1).max(32),
    }),
  },
  responses: {
    200: {
      description: 'Contracts, invoices, payments, disputes, and balance',
      content: { 'application/json': { schema: oblLedgerResponseSchema } },
    },
    400: {
      description: 'Invalid pair',
      content: { 'application/json': { schema: badRequestSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/balance',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Per-pair USD balance summary',
  request: {
    query: z.object({
      accountA: z.string().min(1).max(32),
      accountB: z.string().min(1).max(32),
    }),
  },
  responses: {
    200: {
      description: 'Balance buckets',
      content: { 'application/json': { schema: pairBalanceSchema } },
    },
    400: {
      description: 'Invalid pair',
      content: { 'application/json': { schema: badRequestSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/convert/usd-to-waiv',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Convert USD amount to WAIV using stored engine rates',
  request: {
    query: z.object({
      amountUsd: z.coerce.number().positive(),
    }),
  },
  responses: {
    200: {
      description: 'Conversion result',
      content: { 'application/json': { schema: usdToWaivResponseSchema } },
    },
  },
});

const oblRelationshipRowSchema = registry.register(
  'OblRelationshipRow',
  z.object({
    counterparty: z.string(),
    roles: z.array(z.enum(['provider', 'client'])),
    contractCount: z.number().int(),
    balance: pairBalanceSchema,
    lastActivityAt: z.string().nullable(),
  }),
);

const oblContractSchema = registry.register(
  'OblContract',
  z.object({
    contract_id: z.string(),
    offer_id: z.string(),
    offer_version: z.number().int(),
    provider: z.string(),
    client: z.string(),
    dispute_rule: z.enum(['client', 'provider', 'arbiter']),
    arbiter: z.string().nullable(),
    created_event_seq: z.string(),
    transaction_id: z.string(),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/relationships',
  tags: [queryApiOpenApiTags.obl],
  summary: 'List OBL counterparties and per-pair balance for an account',
  request: {
    query: z.object({
      account: z.string().min(1).max(32),
    }),
  },
  responses: {
    200: {
      description: 'Relationship rows',
      content: { 'application/json': { schema: z.array(oblRelationshipRowSchema) } },
    },
    400: {
      description: 'Invalid account',
      content: { 'application/json': { schema: badRequestSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/obl/contracts/{contractId}',
  tags: [queryApiOpenApiTags.obl],
  summary: 'Get one OBL contract by id',
  request: {
    params: z.object({ contractId: z.string() }),
  },
  responses: {
    200: {
      description: 'Contract row',
      content: { 'application/json': { schema: oblContractSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});
