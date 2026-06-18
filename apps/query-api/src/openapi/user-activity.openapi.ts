import { z } from 'zod';

import { userActivityBodySchema as userActivityBodyZod } from '../domain/feed/schemas/user-activity.schema';
import { registry } from './registry';

const notFoundSchema = z.object({
  statusCode: z.literal(404),
  message: z.string(),
  error: z.string(),
});

const accountNameParam = z.string().min(1).openapi({ example: 'alice' });

const activityItemSchema = registry.register(
  'ActivityItem',
  z.object({
    id: z.string(),
    operationIndex: z.number().int(),
    trxId: z.string(),
    timestamp: z.string().datetime(),
    block: z.number().int(),
    type: z.string(),
    payload: z.record(z.string(), z.unknown()),
  }),
);

const activityChainContextSchema = registry.register(
  'ActivityChainContext',
  z.object({
    totalVestingShares: z.string(),
    totalVestingFundSteem: z.string(),
  }),
);

const userActivityBodySchema = registry.register(
  'UserActivityBody',
  userActivityBodyZod,
);

const userActivityResponseSchema = registry.register(
  'UserActivityResponse',
  z.object({
    items: z.array(activityItemSchema),
    cursor: z.string().nullable(),
    hasMore: z.boolean(),
    chainContext: activityChainContextSchema,
  }),
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/users/{name}/activity',
  summary: 'User profile activity (Hive account history)',
  description:
    'Thin proxy over `condenser_api.get_account_history` for the profile activity tab. Optional `filters` apply Hive operation bitmasks plus server-side semantic matching (vote direction, transfer direction, custom_json follow/reblog). `effective_comment_vote` operations are excluded. Cursor encodes the next Hive `from` operation index only (filters travel in body/URL, not cursor).',
  request: {
    params: z.object({ name: accountNameParam }),
    body: {
      content: {
        'application/json': {
          schema: userActivityBodySchema,
        },
      },
      required: false,
    },
  },
  responses: {
    200: {
      description: 'Activity page.',
      content: {
        'application/json': {
          schema: userActivityResponseSchema,
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
  },
});
