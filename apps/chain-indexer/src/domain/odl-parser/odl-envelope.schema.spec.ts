import { updateUserMetadataPayloadSchema } from './odl-envelope.schema';

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
