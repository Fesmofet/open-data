import { z } from 'zod';

import { waivWalletResponseSchema } from '../domain/wallet/schemas/waiv-wallet.schema';
import { engineTokenDelegationsResponseSchema } from '../domain/wallet/schemas/engine-token-delegations.schema';
import {
  hiveHpDelegationsResponseSchema,
  hiveRcDelegationsResponseSchema,
  hiveWalletResponseSchema,
} from '../domain/wallet/schemas/hive-wallet.schema';
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

const hiveWalletResponseOpenApi = registry.register(
  'HiveWalletResponse',
  hiveWalletResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/hive',
  summary: 'User HIVE wallet summary',
  description:
    'Live Hive L1 wallet snapshot: liquid HIVE, HP, delegations net, RC, savings, HBD, interest, and USD estimate.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'HIVE wallet summary.',
      content: {
        'application/json': {
          schema: hiveWalletResponseOpenApi,
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
      description: 'Hive node unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});

const hiveHpDelegationsOpenApi = registry.register(
  'HiveHpDelegationsResponse',
  hiveHpDelegationsResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/hive/delegations',
  summary: 'Hive HP delegations for a user',
  description:
    'Incoming and outgoing HP delegations from indexed `user_delegations`; pending undelegations from chain RPC.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'HP delegation lists.',
      content: {
        'application/json': {
          schema: hiveHpDelegationsOpenApi,
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
      description: 'Hive node unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});

const hiveRcDelegationsOpenApi = registry.register(
  'HiveRcDelegationsResponse',
  hiveRcDelegationsResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/hive/rc-delegations',
  summary: 'Hive RC delegations for a user',
  description:
    'Incoming RC delegations from indexed `user_rc_delegations`; outgoing from `rc_api.list_rc_direct_delegations`.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'RC delegation lists.',
      content: {
        'application/json': {
          schema: hiveRcDelegationsOpenApi,
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
      description: 'Hive node unavailable.',
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
