import type { DiscoverTagCategorySectionDto } from '../discover/discover.types';

export interface UserShopFiltersResponseDto {
  ratings: number[];
  categories: DiscoverTagCategorySectionDto[];
}
