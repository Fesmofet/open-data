import { Injectable } from '@nestjs/common';
import {
  ObjectsCoreRepository,
  ObjectOwnershipRepository,
  UserSubscriptionsRepository,
} from '../../repositories';
import { avatarUrlFromJoinedAccountRow } from '../users/resolve-avatar-url-from-hive-metadata';
import type { ObjectOwnershipQuery, UserSocialListQuery } from '../social/user-social-list.schema';
import type { PaginatedUserFollowList, UserFollowListItem } from '../social/user-follow-list.types';

@Injectable()
export class GetObjectOwnershipEndpoint {
  constructor(
    private readonly objectsCore: ObjectsCoreRepository,
    private readonly objectOwnership: ObjectOwnershipRepository,
    private readonly subscriptions: UserSubscriptionsRepository,
  ) {}

  async execute(
    objectId: string,
    query: ObjectOwnershipQuery,
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

    const socialQuery: UserSocialListQuery = {
      sort: query.sort,
      skip: query.skip,
      limit: query.limit,
    };

    const [total, rows] = await Promise.all([
      this.objectOwnership.countByObjectIdAndType(id, query.ownership_type),
      this.objectOwnership.findAccountsByObjectIdAndType(
        id,
        query.ownership_type,
        socialQuery.sort,
        socialQuery.skip,
        socialQuery.limit,
      ),
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
      hasMore: items.length > 0 && socialQuery.skip + items.length < total,
    };
  }
}
