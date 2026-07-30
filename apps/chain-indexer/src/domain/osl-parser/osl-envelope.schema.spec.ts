import {
  oslEnvelopeSchema,
  updateUserMetadataPayloadSchema,
} from './osl-envelope.schema';

const baseMetadata = {
  notifications_last_timestamp: 0,
  exit_page_setting: true,
  locale: 'en-US',
  post_locales: [],
  nightmode: false,
  reward_setting: '50' as const,
  rewrite_links: false,
  show_nsfw_posts: false,
  upvote_setting: false,
  vote_percent: 5000,
  voting_power: true,
  currency: null,
  hide_linked_objects: false,
  hide_recipe_objects: false,
};

describe('updateUserMetadataPayloadSchema', () => {
  it('defaults hide_favorite_objects to false when omitted', () => {
    const result = updateUserMetadataPayloadSchema.safeParse(baseMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hide_favorite_objects).toBe(false);
    }
  });

  it('accepts explicit hide_favorite_objects', () => {
    const result = updateUserMetadataPayloadSchema.safeParse({
      ...baseMetadata,
      hide_favorite_objects: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hide_favorite_objects).toBe(true);
    }
  });

  it('rejects unknown fields (strict)', () => {
    const result = updateUserMetadataPayloadSchema.safeParse({
      ...baseMetadata,
      hide_favorite_objects: false,
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('oslEnvelopeSchema', () => {
  it('accepts hive_engine_deposit envelope', () => {
    const parsed = oslEnvelopeSchema.safeParse({
      events: [
        {
          action: 'hive_engine_deposit',
          v: 1,
          payload: {
            author: 'alice',
            destination: 'alice',
            symbol_in: 'HIVE',
            symbol_out: 'SWAP.HIVE',
            pair: 'HIVE -> SWAP.HIVE',
            ex_rate: 1,
            deposit_account: 'honey-swap',
            memo: '{"id":"ssc-mainnet-hive"}',
          },
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts update_user_notification_settings envelope', () => {
    const parsed = oslEnvelopeSchema.safeParse({
      events: [
        {
          action: 'update_user_notification_settings',
          v: 1,
          payload: {
            follow: true,
            reblog: true,
            reply: true,
            mention: true,
            vote: true,
            downvote: false,
            claimed_object_updates: true,
            group_id_control: true,
            followed_user_threads: true,
            transfer: true,
            fill_order: true,
            power_up: true,
            claim_reward: false,
            witness_vote: true,
            my_post: false,
            my_comment: false,
            my_like: false,
            minimal_transfer: 0,
          },
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts update_user_metadata envelope', () => {
    const parsed = oslEnvelopeSchema.safeParse({
      events: [
        {
          action: 'update_user_metadata',
          v: 1,
          payload: baseMetadata,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
