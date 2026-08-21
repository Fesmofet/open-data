import { mapAccountToUserProfileView } from './account-mapper';
import { AccountCurrent } from '@opden-data-layer/odl-db-types';

function accountRow(overrides: Partial<AccountCurrent> = {}): AccountCurrent {
  return {
    name: 'grampo',
    alias: null,
    json_metadata: null,
    profile_image: null,
    posting_json_metadata: null,
    followers_count: 468,
    users_following_count: 12,
    post_count: 100,
    object_reputation: 65,
    wobjects_weight: 476.19,
    ...overrides,
  } as AccountCurrent;
}

describe('mapAccountToUserProfileView', () => {
  it('maps wobjects_weight to wobjectsWeight', () => {
    const view = mapAccountToUserProfileView(accountRow());
    expect(view.wobjectsWeight).toBe(476.19);
    expect(view.reputation).toBe(65);
    expect(view.followerCount).toBe(468);
  });

  it('defaults null wobjects_weight to 0', () => {
    const view = mapAccountToUserProfileView(
      accountRow({ wobjects_weight: null as unknown as number }),
    );
    expect(view.wobjectsWeight).toBe(0);
  });

  it('prefers chain posting_json_metadata for bio', () => {
    const view = mapAccountToUserProfileView(
      accountRow({
        posting_json_metadata: JSON.stringify({
          profile: { about: 'stale bio' },
        }),
      }),
      JSON.stringify({
        profile: { about: 'live bio' },
      }),
    );
    expect(view.bio).toBe('live bio');
  });

  it('prefers posting_json_metadata avatar over json_metadata and profile_image column', () => {
    const view = mapAccountToUserProfileView(
      accountRow({
        profile_image: 'https://column.test/c.jpg',
        json_metadata: JSON.stringify({
          profile: { profile_image: 'https://json.test/b.jpg' },
        }),
        posting_json_metadata: JSON.stringify({
          profile: { profile_image: 'https://posting.test/a.jpg' },
        }),
      }),
    );
    expect(view.avatarUrl).toBe('https://posting.test/a.jpg');
  });

  it('falls back to json_metadata avatar when posting has no profile_image', () => {
    const view = mapAccountToUserProfileView(
      accountRow({
        profile_image: 'https://column.test/c.jpg',
        json_metadata: JSON.stringify({
          profile: { profile_image: 'https://json.test/b.jpg' },
        }),
        posting_json_metadata: JSON.stringify({
          profile: { name: 'Alice' },
        }),
      }),
    );
    expect(view.avatarUrl).toBe('https://json.test/b.jpg');
  });
});
