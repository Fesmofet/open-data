import { Injectable } from '@nestjs/common';
import {
  ObjectCategoriesRepository,
  UserMetadataRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import { parseTagFilters } from '../discover/get-discover-objects.endpoint';
import { groupDiscoverTagCategories } from '../discover/discover-tag-categories.utils';
import { SHOP_RATING_FILTER_THRESHOLDS } from './shop.constants';
import { getTagCategoryOrderForShopTypes } from './shop-registry.utils';
import type { ShopFiltersQuery } from './shop.schema';
import type { UserShopFiltersResponseDto } from './shop.types';
import { shouldHidePostLinkedObjects } from './shop-visibility';

@Injectable()
export class GetUserShopFiltersEndpoint {
  constructor(
    private readonly userMetadataRepo: UserMetadataRepository,
    private readonly shopDeselectRepo: UserShopDeselectRepository,
    private readonly objectCategoriesRepo: ObjectCategoriesRepository,
  ) {}

  async execute(
    username: string,
    query: ShopFiltersQuery,
  ): Promise<UserShopFiltersResponseDto | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const [flags, deselectIds] = await Promise.all([
      this.userMetadataRepo.findShopVisibilityFlags(name),
      this.shopDeselectRepo.findObjectIdsByAccount(name),
    ]);

    const hideLinked = shouldHidePostLinkedObjects(query.types, flags);
    const activeTags = parseTagFilters(query.tags ?? []);

    const rows = await this.objectCategoriesRepo.getShopTagCategories(
      {
        account: name,
        types: query.types,
        categoryPath: query.categoryPath,
        uncategorizedOnly: query.uncategorizedOnly,
        hideLinkedObjects: hideLinked,
        shopDeselectObjectIds: deselectIds,
      },
      activeTags,
      query.rating ?? null,
    );

    const order = getTagCategoryOrderForShopTypes(query.types);
    const grouped = groupDiscoverTagCategories(rows, order);

    return {
      ratings: [...SHOP_RATING_FILTER_THRESHOLDS],
      categories: grouped.categories,
    };
  }
}
