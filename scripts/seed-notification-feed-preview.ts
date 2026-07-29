/**
 * Seed Redis notification feed with one item per event type (UI layout preview).
 *
 * Usage:
 *   pnpm seed:notification-feed-preview
 *   pnpm seed:notification-feed-preview -- --user=flowmaster --other=fesmofet --object=rcl-borkor
 *
 * By default resets `user_metadata.notifications_last_timestamp` to 0 for the user
 * so the unread badge shows after seeding. Pass `--no-reset-read-cursor` to skip.
 *
 * Requires REDIS_URI and Postgres (DATABASE_URL / POSTGRES_*) in .env.
 */

import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type {
  NotificationEventType,
  NotificationPayloadMap,
} from '@opden-data-layer/notifications-contract';
import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import type { OdlDatabase } from '../libs/core/src/db';
import { resolveConnectionString } from '../libs/migrations/src/connection';
import {
  NOTIFICATION_EXPIRY_SEC,
  NOTIFICATION_LIST_MAX,
  notificationListKey,
} from '../apps/notifications/src/constants/notification-feed.constants';

const FEED_TYPES = NOTIFICATION_EVENT_TYPES.filter(
  (t) => t !== 'trx_processed',
) as NotificationEventType[];

type Ctx = {
  readonly user: string;
  readonly other: string;
  readonly object: string;
};

const POST_AUTHOR = 'flowmaster';
const POST_PERMLINK =
  'rustic-beef-and-potato-casserole-with-a-crisp-fennel-and-apple-salad';
const COMMENT_PERMLINK = 'preview-layout-comment-reply';

function parseArgs(): Ctx & { replace: boolean; resetReadCursor: boolean } {
  let user = 'flowmaster';
  let other = 'fesmofet';
  let object = 'rcl-borkor';
  let replace = true;
  let resetReadCursor = true;
  for (const arg of process.argv.slice(2)) {
    if (arg === '--no-replace') {
      replace = false;
    } else if (arg === '--no-reset-read-cursor') {
      resetReadCursor = false;
    } else if (arg.startsWith('--user=')) {
      user = arg.slice('--user='.length).trim();
    } else if (arg.startsWith('--other=')) {
      other = arg.slice('--other='.length).trim();
    } else if (arg.startsWith('--object=')) {
      object = arg.slice('--object='.length).trim();
    }
  }
  return { user, other, object, replace, resetReadCursor };
}

function buildPayload(
  type: NotificationEventType,
  ctx: Ctx,
): Record<string, unknown> {
  const { user, other, object } = ctx;
  const payloads: {
    [K in NotificationEventType]: NotificationPayloadMap[K];
  } = {
    reply: {
      author: other,
      permlink: COMMENT_PERMLINK,
      parentAuthor: user,
      parentPermlink: POST_PERMLINK,
      isRootPost: false,
      replyToPermlink: POST_PERMLINK,
    },
    mention: {
      author: other,
      permlink: POST_PERMLINK,
      isRootPost: true,
      mentioned: user,
    },
    my_post: {
      author: POST_AUTHOR,
      permlink: POST_PERMLINK,
      title: 'Rustic beef and potato casserole',
    },
    my_comment: {
      author: user,
      permlink: COMMENT_PERMLINK,
      parentAuthor: POST_AUTHOR,
    },
    vote_like: {
      voter: other,
      author: POST_AUTHOR,
      permlink: POST_PERMLINK,
      weight: 10000,
    },
    vote_downvote: {
      voter: other,
      author: POST_AUTHOR,
      permlink: POST_PERMLINK,
      weight: -5000,
    },
    my_vote: {
      voter: user,
      author: other,
      permlink: POST_PERMLINK,
      title: 'Rustic beef and potato casserole',
    },
    reblog: {
      account: other,
      author: POST_AUTHOR,
      permlink: POST_PERMLINK,
      title: 'Rustic beef and potato casserole',
    },
    follow: {
      following: user,
      action: 'follow',
    },
    bell_post: {
      author: other,
      permlink: POST_PERMLINK,
      title: 'Preview layout — bell post',
    },
    bell_reblog: {
      account: other,
      author: POST_AUTHOR,
      permlink: POST_PERMLINK,
      title: 'Rustic beef and potato casserole',
    },
    bell_follow: {
      follower: other,
      following: user,
    },
    bell_object_post: {
      author: other,
      permlink: POST_PERMLINK,
      title: 'Preview on object',
      wobjectPermlink: object,
      wobjectName: object,
    },
    bell_thread: {
      author: other,
      permlink: COMMENT_PERMLINK,
      authorPermlink: object,
    },
    thread_author_follower: {
      author: other,
      permlink: POST_PERMLINK,
      hashtags: ['preview', 'layout'],
      mentions: [user],
    },
    transfer_in: {
      from: other,
      to: user,
      amount: '1.250',
      symbol: 'HIVE',
      memo: 'preview transfer in',
    },
    transfer_out: {
      from: user,
      to: other,
      amount: '0.500',
      symbol: 'HBD',
      memo: 'preview transfer out',
    },
    transfer_from_savings: {
      from: user,
      to: user,
      amount: '2.000',
      symbol: 'HBD',
      memo: 'preview savings',
    },
    power_up: {
      from: user,
      to: user,
      amount: '10.000',
    },
    power_down: {
      account: user,
      amount: '5.000',
    },
    claim_reward: {
      rewardHive: '0.012',
      rewardHbd: '0.034',
      rewardHp: '0.056',
    },
    witness_vote: {
      witness: user,
      approve: true,
    },
    fill_order: {
      currentPays: '1.000 HIVE',
      openPays: '0.250 HBD',
      exchanger: other,
      orderId: 42,
    },
    withdraw_route: {
      fromAccount: user,
      toAccount: other,
      percent: 5000,
      autoVest: false,
    },
    change_recovery_account: {
      account: user,
      newRecoveryAccount: other,
    },
    change_password: {
      account: user,
    },
    hp_delegation: {
      delegator: other,
      delegatee: user,
      amount: '100.000',
    },
    engine_transfer: {
      from: other,
      to: user,
      amount: '25.5',
      symbol: 'WAIV',
      memo: 'preview engine transfer',
    },
    engine_stake: {
      from: user,
      to: user,
      amount: '10',
      symbol: 'WAIV',
    },
    engine_unstake: {
      account: user,
      amount: '3',
      symbol: 'WAIV',
    },
    engine_cancel_unstake: {
      account: user,
      amount: '3',
      symbol: 'WAIV',
    },
    engine_delegate: {
      from: other,
      to: user,
      amount: '50',
      symbol: 'WAIV',
    },
    engine_undelegate: {
      from: user,
      to: other,
      amount: '12',
      symbol: 'WAIV',
    },
    object_update: {
      updateId: 'preview-update-001',
      updateType: 'title',
      objectName: object,
      authorPermlink: object,
    },
    object_update_reject: {
      updateId: 'preview-update-002',
      updateType: 'description',
      objectName: object,
      authorPermlink: object,
      voter: other,
    },
    object_status_change: {
      objectName: object,
      authorPermlink: object,
      oldStatus: 'active',
      newStatus: 'unavailable',
      account: other,
    },
    update_vote_cast: {
      updateId: 'preview-update-003',
      vote: 'approve',
    },
    object_created: {
      updateId: 'preview-update-legacy',
      updateType: 'create',
    },
    batch_import_completed: {
      cid: 'bafypreviewbatchimportcid000000000000000000000000000000',
    },
    trx_processed: {},
  };
  return payloads[type] as Record<string, unknown>;
}

function actorForType(type: NotificationEventType, ctx: Ctx): string | null {
  const { user, other } = ctx;
  switch (type) {
    case 'my_post':
    case 'my_comment':
    case 'my_vote':
    case 'transfer_out':
    case 'power_up':
    case 'power_down':
    case 'claim_reward':
    case 'change_password':
    case 'change_recovery_account':
    case 'withdraw_route':
    case 'transfer_from_savings':
    case 'engine_stake':
    case 'engine_unstake':
    case 'engine_cancel_unstake':
    case 'engine_undelegate':
      return user;
    case 'witness_vote':
      return other;
    case 'follow':
    case 'bell_follow':
      return other;
    case 'batch_import_completed':
    case 'trx_processed':
      return null;
    default:
      return other;
  }
}

function objectIdForType(type: NotificationEventType, ctx: Ctx): string | null {
  const objectTypes = new Set<NotificationEventType>([
    'object_update',
    'object_update_reject',
    'object_status_change',
    'update_vote_cast',
    'object_created',
    'bell_object_post',
  ]);
  if (objectTypes.has(type)) {
    return ctx.object;
  }
  return null;
}

function buildItems(ctx: Ctx) {
  const baseMs = Date.now();
  const items = FEED_TYPES.map((type, index) => {
    // 1s apart so preview unread count is stable (not ~N/39 from minute-spread + cursor).
    const occurredAt = new Date(baseMs - index * 1_000).toISOString();
    return {
      id: randomUUID(),
      type,
      occurredAt,
      blockNum: 90_000_000 + index,
      trxId: `preview${index.toString(16).padStart(8, '0')}`,
      objectId: objectIdForType(type, ctx),
      actor: actorForType(type, ctx),
      payload: buildPayload(type, ctx),
    };
  });
  return items;
}

async function resetReadCursorForUser(account: string): Promise<void> {
  const trimmed = account.trim();
  if (trimmed.length === 0) {
    return;
  }
  const pool = new Pool({ connectionString: resolveConnectionString() });
  const db = new Kysely<OdlDatabase>({ dialect: new PostgresDialect({ pool }) });
  try {
    const hasAccount = await db
      .selectFrom('accounts_current')
      .select('name')
      .where('name', '=', trimmed)
      .executeTakeFirst();
    if (!hasAccount) {
      console.warn(
        `No accounts_current row for @${trimmed}; read cursor not reset.`,
      );
      return;
    }

    await db
      .insertInto('user_metadata')
      .values({
        account: trimmed,
        notifications_last_timestamp: 0,
        exit_page_setting: true,
        locale: 'en-US',
        post_locales: [],
        nightmode: false,
        reward_setting: '50',
        rewrite_links: false,
        show_nsfw_posts: false,
        upvote_setting: false,
        vote_percent: 5000,
        voting_power: true,
        currency: null,
        hide_linked_objects: false,
        hide_recipe_objects: false,
        hide_favorite_objects: false,
      })
      .onConflict((oc) =>
        oc.column('account').doUpdateSet({
          notifications_last_timestamp: 0,
        }),
      )
      .execute();

    console.log(`Reset notifications_last_timestamp to 0 for @${trimmed}.`);

    const row = await db
      .selectFrom('user_metadata')
      .select('notifications_last_timestamp')
      .where('account', '=', trimmed)
      .executeTakeFirst();
    console.log(
      `PG notifications_last_timestamp for @${trimmed}: ${row?.notifications_last_timestamp ?? 'NO ROW'}`,
    );
  } finally {
    await db.destroy();
  }
}

async function main(): Promise<void> {
  const redisUri = process.env.REDIS_URI?.trim();
  if (!redisUri) {
    throw new Error('REDIS_URI is not set (use --env-file=.env)');
  }

  const { user, other, object, replace, resetReadCursor } = parseArgs();
  const key = notificationListKey(user);
  const items = buildItems({ user, other, object });

  if (items.length > NOTIFICATION_LIST_MAX) {
    throw new Error(
      `Generated ${items.length} items but NOTIFICATION_LIST_MAX is ${NOTIFICATION_LIST_MAX}`,
    );
  }

  const redis = new Redis(redisUri, { maxRetriesPerRequest: 1 });
  try {
    if (replace) {
      await redis.del(key);
    }
    const serialized = items.map((item) => JSON.stringify(item));
    const pipe = redis.pipeline();
    for (let i = serialized.length - 1; i >= 0; i--) {
      pipe.lpush(key, serialized[i]!);
    }
    pipe.ltrim(key, 0, NOTIFICATION_LIST_MAX - 1);
    pipe.expire(key, NOTIFICATION_EXPIRY_SEC);
    await pipe.exec();

    const len = await redis.llen(key);
    console.log(
      `Seeded ${len} notification(s) for @${user} at ${key} (${FEED_TYPES.length} types, actor=@${other}, object=${object}).`,
    );
    console.log(
      `Open the bell as @${user} (logged-in session) to preview layout.`,
    );
    if (resetReadCursor) {
      await resetReadCursorForUser(user);
    }

    console.log('');
    console.log('Preview reset checklist:');
    console.log(`  1. Redis feed: ${key} (${len} items)`);
    console.log(
      `  2. Browser DevTools → Application → Local Storage → remove key: odl_notifications_last_seen_${user}`,
    );
    console.log('  3. Hard refresh (do NOT open bell before checking badge).');
    console.log(
      '  4. Logged-in Hive account must match --user exactly (case-sensitive).',
    );
  } finally {
    redis.disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
