import { Injectable } from '@nestjs/common';
import {
  ObjectsCoreRepository,
  UserObjectExpertiseRepository,
  UserSubscriptionsRepository,
} from '../../repositories';
import type { ObjectExpertListQuery } from './object-expert-list.schema';
import type { ObjectExpertListItem, PaginatedObjectExpertList } from './object-expert-list.types';

@Injectable()
export class GetObjectExpertsEndpoint {
  constructor(
    private readonly objectsCore: ObjectsCoreRepository,
    private readonly userObjectExpertise: UserObjectExpertiseRepository,
    private readonly subscriptions: UserSubscriptionsRepository,
  ) {}

  async execute(
    objectId: string,
    query: ObjectExpertListQuery,
    viewerAccount: string | undefined,
  ): Promise<PaginatedObjectExpertList | null> {
    const id = objectId.trim();
    if (id.length === 0) {
      return null;
    }

    const core = await this.objectsCore.findByObjectIdForPage(id);
    if (!core) {
      return null;
    }

    const [total, rows] = await Promise.all([
      this.userObjectExpertise.countByObjectId(id),
      this.userObjectExpertise.listAccountsByObjectId(id, query.skip, query.limit),
    ]);

    const accountNames = rows.map((r) => r.name);
    const viewer = viewerAccount?.trim();
    const followedByViewer =
      viewer && viewer.length > 0
        ? new Set(await this.subscriptions.listFollowedSubset(viewer, accountNames))
        : new Set<string>();

    const items: ObjectExpertListItem[] = rows.map((r) => ({
      name: r.name,
      avatarUrl: r.profile_image,
      objectExpertiseWeight: r.weight,
      usersFollowingCount: r.users_following_count,
      isCurrentFollowing: followedByViewer.has(r.name),
    }));

    return {
      items,
      total,
      hasMore: query.skip + items.length < total,
    };
  }
}
