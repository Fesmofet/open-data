import type { UserProfileShellUser } from '@/modules/user-profile';

const DEMO_ACCOUNT = 'demo';

const DEMO_PROFILE_SHELL_USER: UserProfileShellUser = {
  id: 'demo',
  name: 'demo',
  displayName: 'Demo',
  bio: 'Route-layer mock profile for layout parity when query-api is unavailable.',
  followerCount: 0,
  followingCount: 0,
  postingCount: 2,
  wobjectsWeight: 0,
  coverImageUrl: null,
  avatarUrl: 'https://images.hive.blog/u/demo/avatar/small',
  isFollowing: false,
  viewerBell: false,
};

/** Returns a stub profile only for the `demo` account (case-insensitive). */
export function getMockProfileShellUser(
  accountName: string,
): UserProfileShellUser | null {
  if (accountName.trim().toLowerCase() !== DEMO_ACCOUNT) {
    return null;
  }
  return DEMO_PROFILE_SHELL_USER;
}
