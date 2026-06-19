import { z } from 'zod';

import { waivWalletResponseSchema } from '../domain/wallet/schemas/waiv-wallet.schema';
import { engineTokenDelegationsResponseSchema } from '../domain/wallet/schemas/engine-token-delegations.schema';
import { registry } from './registry';

const badRequestSchema = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  error: z.string(),
});

const notFoundSchema = z.object({
  statusCode: z.literal(404),
  message: z.string(),
  error: z.string(),
});

const serviceUnavailableSchema = z.object({
  statusCode: z.literal(503),
  message: z.string(),
  error: z.string(),
});

const accountNameParam = z.string().min(1).openapi({ example: 'alice' });
const symbolParam = z.string().min(1).openapi({ example: 'WAIV' });

const waivWalletResponseOpenApi = registry.register(
  'WaivWalletResponse',
  waivWalletResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/waiv',
  summary: 'User WAIV wallet summary',
  description:
    'Live Hive Engine WAIV balance snapshot with legacy display fields and USD estimate via currency engine rates.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'WAIV wallet summary.',
      content: {
        'application/json': {
          schema: waivWalletResponseOpenApi,
        },
      },
    },
    404: {
      description: 'No `accounts_current` row for `name`.',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
    503: {
      description: 'Hive Engine unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});

const engineTokenDelegationsOpenApi = registry.register(
  'EngineTokenDelegationsResponse',
  engineTokenDelegationsResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/{symbol}/delegations',
  summary: 'Hive Engine token delegations for a user',
  description:
    'Incoming and outgoing `tokens.delegations` rows for the profile account and symbol.',
  request: {
    params: z.object({ name: accountNameParam, symbol: symbolParam }),
  },
  responses: {
    200: {
      description: 'Delegation lists.',
      content: {
        'application/json': {
          schema: engineTokenDelegationsOpenApi,
        },
      },
    },
    404: {
      description: 'No `accounts_current` row for `name`.',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
    400: {
      description: 'Invalid token symbol.',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
    503: {
      description: 'Hive Engine unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});
