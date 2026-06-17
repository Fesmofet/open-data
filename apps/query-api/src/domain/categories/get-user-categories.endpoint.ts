import { Injectable } from '@nestjs/common';
import {
  ObjectCategoriesRelatedRepository,
  ObjectCategoriesRepository,
  UserMetadataRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import { shouldHidePostLinkedObjects } from '../shop/shop-visibility';
import type { UserCategoriesQuery, UserCategoriesResponse } from './categories-query.schema';
import { buildUserCategoriesResponse } from './build-user-categories-response';

@Injectable()
export class GetUserCategoriesEndpoint {
  constructor(
    private readonly objectCategoriesRelatedRepository: ObjectCategoriesRelatedRepository,
    private readonly objectCategoriesRepo: ObjectCategoriesRepository,
    private readonly userMetadataRepo: UserMetadataRepository,
    private readonly shopDeselectRepo: UserShopDeselectRepository,
  ) {}

  async execute(username: string, query: UserCategoriesQuery): Promise<UserCategoriesResponse> {
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      return { items: [], uncategorized_count: 0, show_other: false };
    }

    const rows = await this.objectCategoriesRelatedRepository.findByUserScope(trimmed, query.types);
    const response = buildUserCategoriesResponse(rows, query);

    const nameSegment = query.name?.trim();
    if (!nameSegment || nameSegment.length === 0) {
      const [flags, deselectIds] = await Promise.all([
        this.userMetadataRepo.findShopVisibilityFlags(trimmed),
        this.shopDeselectRepo.findObjectIdsByAccount(trimmed),
      ]);
      const hideLinked = shouldHidePostLinkedObjects(query.types, flags);
      response.uncategorized_count =
        await this.objectCategoriesRepo.countUncategorizedObjectIdsByScope({
          username: trimmed,
          types: query.types,
          hideLinkedObjects: hideLinked,
          shopDeselectObjectIds: deselectIds,
        });
    }

    return response;
  }
}
