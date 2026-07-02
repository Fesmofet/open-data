import {
  toFeedAuthorProfileFallback,
  toFeedAuthorProfileFromUserProfile,
} from './to-feed-author-profile';
import type { UserProfileView } from '../users/user-profile.types';

function profile(overrides: Partial<UserProfileView> = {}): UserProfileView {
  return {
    name: 'alice',
    displayName: 'Alice',
    bio: '',
    avatarUrl: null,
    coverImageUrl: null,
    followerCount: 10,
    followingCount: 5,
    postingCount: 3,
    reputation: 42,
    wobjectsWeight: 469.18,
    is_following: false,
    viewer_bell: false,
    ...overrides,
  };
}

describe('toFeedAuthorProfileFromUserProfile', () => {
  it('maps wobjectsWeight from profile view', () => {
    const result = toFeedAuthorProfileFromUserProfile(profile());
    expect(result.wobjectsWeight).toBe(469.18);
    expect(result.reputation).toBe(42);
    expect(result.name).toBe('alice');
  });
});

describe('toFeedAuthorProfileFallback', () => {
  it('defaults wobjectsWeight to 0', () => {
    expect(toFeedAuthorProfileFallback('bob').wobjectsWeight).toBe(0);
  });

  it('uses provided wobjectsWeight', () => {
    expect(
      toFeedAuthorProfileFallback('bob', { wobjectsWeight: 12.5 }).wobjectsWeight,
    ).toBe(12.5);
  });
});
