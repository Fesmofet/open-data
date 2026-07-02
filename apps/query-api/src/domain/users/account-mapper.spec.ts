import type { AccountCurrent } from '@opden-data-layer/core';

import { mapAccountToUserProfileView } from './account-mapper';

function accountRow(overrides: Partial<AccountCurrent> = {}): AccountCurrent {
  return {
    name: 'grampo',
    alias: null,
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
});
