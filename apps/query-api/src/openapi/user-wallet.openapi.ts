import { z } from 'zod';

import { waivWalletResponseSchema } from '../domain/wallet/schemas/waiv-wallet.schema';
import { waivWalletHistoryResponseSchema } from '../domain/wallet/schemas/waiv-wallet-history.schema';
import { waivWalletHistoryBodySchema } from '../domain/wallet/schemas/waiv-wallet-history.schema';
import { engineWalletResponseSchema } from '../domain/wallet/schemas/engine-wallet.schema';
import {
  engineWalletHistoryBodySchema,
  engineWalletHistoryResponseSchema,
} from '../domain/wallet/schemas/engine-wallet-history.schema';
import {
  engineDepositAddressQuerySchema,
  engineDepositAddressResponseSchema,
  engineDepositListResponseSchema,
  engineSwapListResponseSchema,
  engineSwapQuoteBodySchema,
  engineSwapQuoteResponseSchema,
  engineWithdrawListResponseSchema,
  engineWithdrawQuoteBodySchema,
  engineWithdrawQuoteResponseSchema,
} from '../domain/wallet/schemas/engine-swap.schema';
import { engineTokenDelegationsResponseSchema } from '../domain/wallet/schemas/engine-token-delegations.schema';
import {
  hiveHpDelegationsResponseSchema,
  hiveRcDelegationsResponseSchema,
  hiveWalletResponseSchema,
} from '../domain/wallet/schemas/hive-wallet.schema';
import {
  hiveChangellyWithdrawCreateBodySchema,
  hiveChangellyWithdrawCreateResponseSchema,
  hiveChangellyWithdrawEstimateBodySchema,
  hiveChangellyWithdrawEstimateResponseSchema,
  hiveChangellyWithdrawRangeQuerySchema,
  hiveChangellyWithdrawRangeResponseSchema,
} from '../domain/wallet/schemas/hive-changelly-withdraw.schema';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

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
  tags: [queryApiOpenApiTags.userWallet],
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

const waivWalletHistoryBodyOpenApi = registry.register(
  'WaivWalletHistoryBody',
  waivWalletHistoryBodySchema,
);

const waivWalletHistoryResponseOpenApi = registry.register(
  'WaivWalletHistoryResponse',
  waivWalletHistoryResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/waiv/history',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'User WAIV wallet transaction history',
  description:
    'Paginated WAIV wallet history merged from Hive Engine accountHistory RPC, indexed swaps, WAIV airdrops, and deposit instruction rows (`hive_engine_deposit_records`). Item `source`: `rpc`, `swap`, `airdrop`, or `deposit`.',
  request: {
    params: z.object({ name: accountNameParam }),
    body: {
      content: {
        'application/json': {
          schema: waivWalletHistoryBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'WAIV wallet history page.',
      content: {
        'application/json': {
          schema: waivWalletHistoryResponseOpenApi,
        },
      },
    },
    400: {
      description: 'Invalid cursor or body.',
      content: {
        'application/json': {
          schema: badRequestSchema,
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
      description: 'Hive Engine history unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});

const engineWalletResponseOpenApi = registry.register(
  'EngineWalletResponse',
  engineWalletResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'User Hive Engine wallet summary',
  description:
    'Live Hive Engine token balances with pinned SWAP.* pegged tokens, other token rows, and USD estimate.',
  request: {
    params: z.object({ name: accountNameParam }),
  },
  responses: {
    200: {
      description: 'Hive Engine wallet summary.',
      content: {
        'application/json': {
          schema: engineWalletResponseOpenApi,
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

const engineWalletHistoryBodyOpenApi = registry.register(
  'EngineWalletHistoryBody',
  engineWalletHistoryBodySchema,
);

const engineWalletHistoryResponseOpenApi = registry.register(
  'EngineWalletHistoryResponse',
  engineWalletHistoryResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/engine/history',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'User Hive Engine wallet transaction history',
  description:
    'Paginated Hive Engine wallet history merged from accountHistory RPC (excluding WAIV), indexed swaps, and deposit instruction rows (`hive_engine_deposit_records`). Item `source`: `rpc`, `swap`, or `deposit`.',
  request: {
    params: z.object({ name: accountNameParam }),
    body: {
      content: {
        'application/json': {
          schema: engineWalletHistoryBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Hive Engine wallet history page.',
      content: {
        'application/json': {
          schema: engineWalletHistoryResponseOpenApi,
        },
      },
    },
    400: {
      description: 'Invalid cursor or body.',
      content: {
        'application/json': {
          schema: badRequestSchema,
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
      description: 'Hive Engine history unavailable.',
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
  tags: [queryApiOpenApiTags.userWallet],
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
  tags: [queryApiOpenApiTags.userWallet],
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
  tags: [queryApiOpenApiTags.userWallet],
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

const engineSwapListOpenApi = registry.register(
  'EngineSwapListResponse',
  engineSwapListResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/swap/list',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine swap token list',
  request: { params: z.object({ name: accountNameParam }) },
  responses: {
    200: {
      description: 'Swappable tokens with pool adjacency.',
      content: { 'application/json': { schema: engineSwapListOpenApi } },
    },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
    503: { description: 'Hive Engine unavailable.', content: { 'application/json': { schema: serviceUnavailableSchema } } },
  },
});

const engineSwapQuoteBodyOpenApi = registry.register(
  'EngineSwapQuoteBody',
  engineSwapQuoteBodySchema,
);
const engineSwapQuoteResponseOpenApi = registry.register(
  'EngineSwapQuoteResponse',
  engineSwapQuoteResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/engine/swap/quote',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine swap quote',
  request: {
    params: z.object({ name: accountNameParam }),
    body: { content: { 'application/json': { schema: engineSwapQuoteBodyOpenApi } } },
  },
  responses: {
    200: {
      description: 'AMM swap quote with custom_json payloads.',
      content: { 'application/json': { schema: engineSwapQuoteResponseOpenApi } },
    },
    400: { description: 'Invalid pair or amount.', content: { 'application/json': { schema: badRequestSchema } } },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
    503: { description: 'Hive Engine unavailable.', content: { 'application/json': { schema: serviceUnavailableSchema } } },
  },
});

const engineDepositListOpenApi = registry.register(
  'EngineDepositListResponse',
  engineDepositListResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/deposit/list',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine deposit token list',
  request: { params: z.object({ name: accountNameParam }) },
  responses: {
    200: { description: 'Depositable tokens.', content: { 'application/json': { schema: engineDepositListOpenApi } } },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
    503: { description: 'Converter unavailable.', content: { 'application/json': { schema: serviceUnavailableSchema } } },
  },
});

const engineDepositAddressQueryOpenApi = registry.register(
  'EngineDepositAddressQuery',
  engineDepositAddressQuerySchema,
);
const engineDepositAddressResponseOpenApi = registry.register(
  'EngineDepositAddressResponse',
  engineDepositAddressResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/deposit/address',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine deposit routing',
  request: {
    params: z.object({ name: accountNameParam }),
    query: engineDepositAddressQueryOpenApi,
  },
  responses: {
    200: {
      description: 'Deposit address / account / memo routing.',
      content: { 'application/json': { schema: engineDepositAddressResponseOpenApi } },
    },
    400: { description: 'Unsupported symbol.', content: { 'application/json': { schema: badRequestSchema } } },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
    503: { description: 'Converter unavailable.', content: { 'application/json': { schema: serviceUnavailableSchema } } },
  },
});

const engineWithdrawListOpenApi = registry.register(
  'EngineWithdrawListResponse',
  engineWithdrawListResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/withdraw/list',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine withdraw route list',
  request: { params: z.object({ name: accountNameParam }) },
  responses: {
    200: { description: 'Withdraw pairs for held balances.', content: { 'application/json': { schema: engineWithdrawListOpenApi } } },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
    503: { description: 'Hive Engine unavailable.', content: { 'application/json': { schema: serviceUnavailableSchema } } },
  },
});

const engineWithdrawQuoteBodyOpenApi = registry.register(
  'EngineWithdrawQuoteBody',
  engineWithdrawQuoteBodySchema,
);
const engineWithdrawQuoteResponseOpenApi = registry.register(
  'EngineWithdrawQuoteResponse',
  engineWithdrawQuoteResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/engine/withdraw/quote',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Hive Engine withdraw quote',
  request: {
    params: z.object({ name: accountNameParam }),
    body: { content: { 'application/json': { schema: engineWithdrawQuoteBodyOpenApi } } },
  },
  responses: {
    200: {
      description: 'Predictive receive amount and optional custom_json sequence.',
      content: { 'application/json': { schema: engineWithdrawQuoteResponseOpenApi } },
    },
    404: { description: 'Unknown account.', content: { 'application/json': { schema: notFoundSchema } } },
  },
});

const engineTokenDelegationsOpenApi = registry.register(
  'EngineTokenDelegationsResponse',
  engineTokenDelegationsResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/engine/{symbol}/delegations',
  tags: [queryApiOpenApiTags.userWallet],
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

const hiveChangellyWithdrawRangeQueryOpenApi = registry.register(
  'HiveChangellyWithdrawRangeQuery',
  hiveChangellyWithdrawRangeQuerySchema,
);
const hiveChangellyWithdrawRangeResponseOpenApi = registry.register(
  'HiveChangellyWithdrawRangeResponse',
  hiveChangellyWithdrawRangeResponseSchema,
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/users/{name}/wallet/hive/withdraw/range',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Changelly HIVE withdraw pair limits and rate',
  request: {
    params: z.object({ name: accountNameParam }),
    query: hiveChangellyWithdrawRangeQueryOpenApi,
  },
  responses: {
    200: {
      description: 'Min/max HIVE amount and 1 HIVE → output coin rate.',
      content: {
        'application/json': { schema: hiveChangellyWithdrawRangeResponseOpenApi },
      },
    },
    400: {
      description: 'Unsupported output coin.',
      content: { 'application/json': { schema: badRequestSchema } },
    },
    404: {
      description: 'Unknown account.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
    503: {
      description: 'Changelly unavailable.',
      content: { 'application/json': { schema: serviceUnavailableSchema } },
    },
  },
});

const hiveChangellyWithdrawEstimateBodyOpenApi = registry.register(
  'HiveChangellyWithdrawEstimateBody',
  hiveChangellyWithdrawEstimateBodySchema,
);
const hiveChangellyWithdrawEstimateResponseOpenApi = registry.register(
  'HiveChangellyWithdrawEstimateResponse',
  hiveChangellyWithdrawEstimateResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/hive/withdraw/estimate',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Changelly HIVE withdraw output estimate',
  request: {
    params: z.object({ name: accountNameParam }),
    body: {
      content: { 'application/json': { schema: hiveChangellyWithdrawEstimateBodyOpenApi } },
    },
  },
  responses: {
    200: {
      description: 'Predicted receive amount in output coin.',
      content: {
        'application/json': { schema: hiveChangellyWithdrawEstimateResponseOpenApi },
      },
    },
    400: {
      description: 'Unsupported output coin.',
      content: { 'application/json': { schema: badRequestSchema } },
    },
    404: {
      description: 'Unknown account.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
    503: {
      description: 'Changelly unavailable.',
      content: { 'application/json': { schema: serviceUnavailableSchema } },
    },
  },
});

const hiveChangellyWithdrawCreateBodyOpenApi = registry.register(
  'HiveChangellyWithdrawCreateBody',
  hiveChangellyWithdrawCreateBodySchema,
);
const hiveChangellyWithdrawCreateResponseOpenApi = registry.register(
  'HiveChangellyWithdrawCreateResponse',
  hiveChangellyWithdrawCreateResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/wallet/hive/withdraw/create',
  tags: [queryApiOpenApiTags.userWallet],
  summary: 'Create Changelly HIVE withdraw transaction',
  description:
    'Returns Changelly pay-in routing (receiver + memo) for client-side L1 transfer broadcast. Web signs two transfers: pay-in amount + 0.001 HIVE self-memo with track URL.',
  request: {
    params: z.object({ name: accountNameParam }),
    body: {
      content: { 'application/json': { schema: hiveChangellyWithdrawCreateBodyOpenApi } },
    },
  },
  responses: {
    200: {
      description: 'Changelly pay-in instructions and tracking metadata.',
      content: {
        'application/json': { schema: hiveChangellyWithdrawCreateResponseOpenApi },
      },
    },
    400: {
      description:
        'Insufficient balance, USD cap exceeded, amount outside pair limits, or unsupported coin.',
      content: { 'application/json': { schema: badRequestSchema } },
    },
    404: {
      description: 'Unknown account.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
    503: {
      description: 'Changelly or Hive node unavailable.',
      content: { 'application/json': { schema: serviceUnavailableSchema } },
    },
  },
});
