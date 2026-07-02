import type { FeedStoryItemDto } from './feed-story-dtos';
import type { UserProfileView } from '../users/user-profile.types';

export type FeedAuthorProfile = FeedStoryItemDto['authorProfile'];

export function toFeedAuthorProfileFromUserProfile(
  profile: UserProfileView,
): FeedAuthorProfile {
  return {
    name: profile.name,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    reputation: profile.reputation,
    wobjectsWeight: profile.wobjectsWeight,
  };
}

export function toFeedAuthorProfileFallback(
  name: string,
  options?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    reputation?: number;
    wobjectsWeight?: number;
  },
): FeedAuthorProfile {
  return {
    name,
    displayName: options?.displayName ?? null,
    avatarUrl: options?.avatarUrl ?? null,
    reputation: options?.reputation ?? 0,
    wobjectsWeight: options?.wobjectsWeight ?? 0,
  };
}
