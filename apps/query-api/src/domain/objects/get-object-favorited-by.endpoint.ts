import { Injectable } from '@nestjs/common';
import {
  ObjectsCoreRepository,
  ObjectFavoriteRepository,
  UserSubscriptionsRepository,
} from '../../repositories';
import { avatarUrlFromJoinedAccountRow } from '../users/resolve-avatar-url-from-hive-metadata';
import type { UserSocialListQuery } from '../social/user-social-list.schema';
import type { PaginatedUserFollowList, UserFollowListItem } from '../social/user-follow-list.types';

@Injectable()
export class GetObjectFavoritedByEndpoint {
  constructor(
    private readonly objectsCore: ObjectsCoreRepository,
    private readonly objectFavorite: ObjectFavoriteRepository,
    private readonly subscriptions: UserSubscriptionsRepository,
  ) {}

  async execute(
    objectId: string,
    query: UserSocialListQuery,
    viewerAccount: string | undefined,
  ): Promise<PaginatedUserFollowList | null> {
    const id = objectId.trim();
    if (id.length === 0) {
      return null;
    }

    const core = await this.objectsCore.findByObjectIdForPage(id);
    if (!core) {
      return null;
    }

    const [total, rows] = await Promise.all([
      this.objectFavorite.countByObjectId(id),
      this.objectFavorite.findAccountsByObjectId(id, query.sort, query.skip, query.limit),
    ]);

    const accountNames = rows.map((r) => r.name);
    const viewer = viewerAccount?.trim();
    const followedByViewer =
      viewer && viewer.length > 0
        ? new Set(await this.subscriptions.listFollowedSubset(viewer, accountNames))
        : new Set<string>();

    const items: UserFollowListItem[] = rows.map((r) => ({
      name: r.name,
      avatarUrl: avatarUrlFromJoinedAccountRow(r),
      wobjectsWeight: r.wobjects_weight,
      usersFollowingCount: r.users_following_count,
      isCurrentFollowing: followedByViewer.has(r.name),
    }));

    return {
      items,
      total,
      hasMore: items.length > 0 && query.skip + items.length < total,
    };
  }
}
