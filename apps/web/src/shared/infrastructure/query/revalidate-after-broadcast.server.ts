'use server';

import { revalidatePath, updateTag } from 'next/cache';

import { queryApiCacheTags } from './query-api-cache-tags';

function objectPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId.trim())}`;
}

function userProfilePath(accountName: string): string {
  return `/user-profile/${encodeURIComponent(accountName.trim())}`;
}

function userPublicTransfersPath(accountName: string): string {
  return `/@${encodeURIComponent(accountName.trim())}/transfers`;
}

/** All wallet summary caches after any L1 or Engine wallet broadcast. */
export async function revalidateUserWalletAfterBroadcast(
  accountName: string,
): Promise<void> {
  const name = accountName.trim().toLowerCase();
  if (name.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.userWaivWallet(name));
  updateTag(queryApiCacheTags.userHiveWallet(name));
  updateTag(queryApiCacheTags.userEngineWallet(name));
  updateTag(queryApiCacheTags.userAccountSidebar(name));
  updateTag(queryApiCacheTags.userHiveHpDelegations(name));
  updateTag(queryApiCacheTags.userHiveRcDelegations(name));
  updateTag(queryApiCacheTags.userEngineTokenDelegations(name, 'WAIV'));
  updateTag(queryApiCacheTags.userActivityFeed(name, 'wallet'));
  revalidatePath(userPublicTransfersPath(name), 'page');
  revalidatePath(`${userProfilePath(name)}/transfers`, 'page');
}

/** @deprecated Use {@link revalidateUserWalletAfterBroadcast}. */
export async function revalidateUserWaivWalletAfterBroadcast(
  accountName: string,
): Promise<void> {
  await revalidateUserWalletAfterBroadcast(accountName);
}

/** @deprecated Use {@link revalidateUserWalletAfterBroadcast}. */
export async function revalidateUserHiveWalletAfterBroadcast(
  accountName: string,
): Promise<void> {
  await revalidateUserWalletAfterBroadcast(accountName);
}

/** After on-chain mutations on an object page (authority, follow, updates, rating, …). */
export async function revalidateObjectAfterBroadcast(
  objectId: string,
  options?: { updateId?: string; mentionedObjectIds?: readonly string[] },
): Promise<void> {
  const id = objectId.trim();
  if (id.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.objectOwnership(id));
  updateTag(queryApiCacheTags.objectFavoritedBy(id));
  updateTag(queryApiCacheTags.objectFollowers(id));
  updateTag(queryApiCacheTags.objectExperts(id));
  updateTag(queryApiCacheTags.objectUpdates(id));
  const updateId = options?.updateId?.trim();
  if (updateId && updateId.length > 0) {
    updateTag(queryApiCacheTags.objectUpdate(id, updateId));
  }
  updateTag(queryApiCacheTags.objectPostsFeed(id));
  updateTag(queryApiCacheTags.objectThreadsFeed(id));
  updateTag(queryApiCacheTags.objectChannel(id));
  updateTag(queryApiCacheTags.objectChannelMessages(id));
  for (const mentionedId of options?.mentionedObjectIds ?? []) {
    const trimmed = mentionedId.trim();
    if (trimmed.length > 0 && trimmed !== id) {
      updateTag(queryApiCacheTags.objectChannelMessages(trimmed));
    }
  }
  revalidatePath(objectPath(id), 'layout');
}

/** User profile hero, followers/following tabs, follow bell. */
export async function revalidateUserSocialAfterBroadcast(accountName: string): Promise<void> {
  const name = accountName.trim().toLowerCase();
  if (name.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.userProfile(name));
  updateTag(queryApiCacheTags.userAccountSidebar(name));
  updateTag(queryApiCacheTags.userFollowers(name));
  updateTag(queryApiCacheTags.userFollowing(name));
  updateTag(queryApiCacheTags.userFollowingObjects(name));
  updateTag(queryApiCacheTags.userFavoritesTypes(name));
  updateTag(queryApiCacheTags.userFavorites(name));
  updateTag(queryApiCacheTags.userFavoritesMap(name));
  revalidatePath(userProfilePath(name), 'layout');
}

/** User permissions (authority grantors/grantees) after grant/revoke broadcast. */
export async function revalidateUserPermissionsAfterBroadcast(
  accountName: string,
): Promise<void> {
  const name = accountName.trim().toLowerCase();
  if (name.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.userAuthorityGrantors(name));
  updateTag(queryApiCacheTags.userAuthorityGrantees(name));
  revalidatePath(`${userProfilePath(name)}/permissions`, 'page');
  revalidatePath(`/@${encodeURIComponent(name)}/permissions`, 'page');
}

/** Hub FEED tab after vote/comment/reblog broadcast. */
export async function revalidateHomeFeedAfterBroadcast(
  viewerUsername?: string | null,
): Promise<void> {
  updateTag(queryApiCacheTags.homeFeed('guest'));
  const name = viewerUsername?.trim().toLowerCase();
  if (name && name.length > 0) {
    updateTag(queryApiCacheTags.homeFeed(name));
  }
  revalidatePath('/', 'page');
}

/** Profile feed tabs and messaging caches after vote/comment/channel broadcast. */
export async function revalidateUserFeedAfterBroadcast(accountName: string): Promise<void> {
  await revalidateMessagingAfterBroadcast(accountName);
}

/** Messaging channel list/detail/messages after OSL channel or message mutations. */
export async function revalidateMessagingAfterBroadcast(
  accountName: string,
  channelId?: string,
): Promise<void> {
  const name = accountName.trim().toLowerCase();
  if (name.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.viewerChannels(name));
  const id = channelId?.trim();
  if (id && id.length > 0) {
    updateTag(queryApiCacheTags.channelDetail(id));
    updateTag(queryApiCacheTags.channelMessages(id));
  }
  updateTag(queryApiCacheTags.userBlogFeed(name));
  updateTag(queryApiCacheTags.userThreadsFeed(name));
  updateTag(queryApiCacheTags.userCommentsFeed(name));
  updateTag(queryApiCacheTags.userMentionsFeed(name));
  updateTag(queryApiCacheTags.userActivityFeed(name));
  revalidatePath(userProfilePath(name), 'layout');
}

/** Notification settings after OSL update_user_notification_settings broadcast. */
export async function revalidateNotificationSettingsAfterBroadcast(
  accountName: string,
): Promise<void> {
  const name = accountName.trim().toLowerCase();
  if (name.length === 0) {
    return;
  }
  updateTag(queryApiCacheTags.userNotificationSettings(name));
  revalidatePath('/notifications/settings', 'page');
}
