import { z } from 'zod';

export const hiveEngineDepositPayloadSchema = z
  .object({
    author: z.string().min(1).max(32),
    destination: z.string().min(1).max(32),
    symbol_in: z.string().min(1).max(32),
    symbol_out: z.string().min(1).max(32),
    pair: z.string().min(1).max(512),
    ex_rate: z.number().finite(),
    memo: z.string().max(8192).optional(),
    deposit_account: z.string().min(1).max(32).optional(),
    address: z.string().min(1).max(256).optional(),
  })
  .superRefine((data, ctx) => {
    const hasAccount = Boolean(data.deposit_account?.trim());
    const hasAddress = Boolean(data.address?.trim());
    if (hasAccount === hasAddress) {
      ctx.addIssue({
        code: 'custom',
        message:
          'hive_engine_deposit: provide exactly one of deposit_account or address',
      });
    }
  });

export type HiveEngineDepositPayload = z.infer<
  typeof hiveEngineDepositPayloadSchema
>;

export const updateUserNotificationSettingsPayloadSchema = z
  .object({
    follow: z.boolean(),
    reblog: z.boolean(),
    reply: z.boolean(),
    mention: z.boolean(),
    vote: z.boolean(),
    downvote: z.boolean(),
    claimed_object_updates: z.boolean(),
    group_id_control: z.boolean(),
    followed_user_threads: z.boolean(),
    transfer: z.boolean(),
    fill_order: z.boolean(),
    power_up: z.boolean(),
    claim_reward: z.boolean(),
    witness_vote: z.boolean(),
    my_post: z.boolean(),
    my_comment: z.boolean(),
    my_like: z.boolean(),
    minimal_transfer: z.number(),
  })
  .strict();

export type UpdateUserNotificationSettingsPayload = z.infer<
  typeof updateUserNotificationSettingsPayloadSchema
>;

/**
 * Full `user_metadata` row (minus `account`, which is always `ctx.creator` on-chain).
 * Replaces the entire row on upsert (legacy: full document overwrite).
 */
export const updateUserMetadataPayloadSchema = z
  .object({
    notifications_last_timestamp: z.number().int(),
    exit_page_setting: z.boolean(),
    locale: z.string().min(1).max(64),
    /** JSONB (`JsonValue`-like); must be JSON-serializable for Postgres. */
    post_locales: z.any().superRefine((value, ctx) => {
      try {
        JSON.stringify(value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'post_locales must be JSON-serializable',
        });
      }
    }),
    nightmode: z.boolean(),
    reward_setting: z.enum(['HP', '50', 'HIVE']),
    rewrite_links: z.boolean(),
    show_nsfw_posts: z.boolean(),
    upvote_setting: z.boolean(),
    vote_percent: z.number().int().min(0).max(10000),
    voting_power: z.boolean(),
    currency: z.union([z.string(), z.null()]),
    hide_linked_objects: z.boolean(),
    hide_recipe_objects: z.boolean(),
    hide_favorite_objects: z.boolean().default(false),
  })
  .strict();

export type UpdateUserMetadataPayload = z.infer<typeof updateUserMetadataPayloadSchema>;

const oslEventSchema = z.object({
  action: z.enum([
    'hive_engine_deposit',
    'update_user_notification_settings',
    'update_user_metadata',
  ]),
  v: z.number().int().min(1),
  event_id: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const oslEnvelopeSchema = z.object({
  events: z.array(oslEventSchema).min(1),
});

export type OslEnvelope = z.infer<typeof oslEnvelopeSchema>;
