import type { CurrencyQueryService } from '@opden-data-layer/currency';
import type {
  OblConversionService,
  OblLedgerService,
  OblOffersService,
  OblRelationshipsService,
} from '../domain/obl';
import type { GetDiscoverObjectsEndpoint } from '../domain/discover/get-discover-objects.endpoint';
import type { GetDiscoverTagCategoriesEndpoint } from '../domain/discover/get-discover-tag-categories.endpoint';
import type { GetDiscoverUsersEndpoint } from '../domain/discover/get-discover-users.endpoint';
import type {
  GetPostByKeyEndpoint,
  GetPostDiscussionEndpoint,
  GetPostVotersEndpoint,
  GetUserBlogFeedEndpoint,
  GetUserBlogObjectFiltersEndpoint,
  GetObjectPostsFeedEndpoint,
  GetObjectThreadsFeedEndpoint,
  GetUserCommentsFeedEndpoint,
  GetUserMentionsFeedEndpoint,
  GetUserThreadsFeedEndpoint,
  GetUserActivityEndpoint,
} from '../domain/feed';
import type { GetObjectUpdatesFeedEndpoint } from '../domain/object-updates/get-object-updates-feed.endpoint';
import type { GetUpdateVotersEndpoint } from '../domain/object-updates/get-update-voters.endpoint';
import type {
  CheckObjectExistsEndpoint,
  GetObjectAuthorityEndpoint,
  GetObjectByIdEndpoint,
  GetObjectFollowersEndpoint,
  GetObjectExpertsEndpoint,
  GetObjectRefListEndpoint,
  GetObjectRelatedAlbumEndpoint,
  GetObjectRelatedAlbumPreviewEndpoint,
  GetObjectOptionsEndpoint,
  GetNestedObjectsEndpoint,
} from '../domain/objects';
import type { GetSearchCountsEndpoint } from '../domain/search/get-search-counts.endpoint';
import type { GetSearchEndpoint } from '../domain/search/get-search.endpoint';
import type { GetUserCategoriesEndpoint } from '../domain/categories/get-user-categories.endpoint';
import type { GetCategoryObjectsEndpoint } from '../domain/categories/get-category-objects.endpoint';
import type {
  GetUserShopFiltersEndpoint,
  GetUserShopObjectsEndpoint,
  GetUserShopSectionsEndpoint,
} from '../domain/shop';
import type {
  GetUserFollowersEndpoint,
  GetUserFollowingEndpoint,
  GetUserFollowingObjectsEndpoint,
} from '../domain/social';
import type {
  GetUserFavoritesEndpoint,
  GetUserFavoritesTypesEndpoint,
  PostUserFavoritesMapEndpoint,
} from '../domain/favorites';
import type {
  GetUserExpertiseCountersEndpoint,
  GetUserExpertiseObjectsEndpoint,
} from '../domain/expertise';
import type { GetUserProfileEndpoint, GetUserAccountSidebarEndpoint } from '../domain/users';
import type {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserHiveHpDelegationsEndpoint,
  GetUserHiveRcDelegationsEndpoint,
  GetUserWaivWalletEndpoint,
  GetUserWaivWalletHistoryEndpoint,
  GetUserEngineWalletEndpoint,
  GetUserEngineWalletHistoryEndpoint,
  GetUserEngineSwapListEndpoint,
  PostUserEngineSwapQuoteEndpoint,
  GetUserEngineDepositAddressEndpoint,
  PostUserEngineWithdrawQuoteEndpoint,
  GetHiveAdvancedReportEndpoint,
  UpsertHiveWalletExemptionEndpoint,
} from '../domain/wallet';

export interface McpToolDeps {
  search: GetSearchEndpoint;
  searchCounts: GetSearchCountsEndpoint;
  discoverObjects: GetDiscoverObjectsEndpoint;
  discoverUsers: GetDiscoverUsersEndpoint;
  discoverTagCategories: GetDiscoverTagCategoriesEndpoint;
  getObjectById: GetObjectByIdEndpoint;
  getNestedObjects: GetNestedObjectsEndpoint;
  checkObjectExists: CheckObjectExistsEndpoint;
  getObjectRefList: GetObjectRefListEndpoint;
  getObjectOptions: GetObjectOptionsEndpoint;
  getObjectRelatedAlbumPreview: GetObjectRelatedAlbumPreviewEndpoint;
  getObjectRelatedAlbum: GetObjectRelatedAlbumEndpoint;
  getObjectFollowers: GetObjectFollowersEndpoint;
  getObjectExperts: GetObjectExpertsEndpoint;
  getObjectAuthority: GetObjectAuthorityEndpoint;
  getObjectUpdatesFeed: GetObjectUpdatesFeedEndpoint;
  getObjectPostsFeed: GetObjectPostsFeedEndpoint;
  getObjectThreadsFeed: GetObjectThreadsFeedEndpoint;
  getUpdateVoters: GetUpdateVotersEndpoint;
  getUserProfile: GetUserProfileEndpoint;
  getUserAccountSidebar: GetUserAccountSidebarEndpoint;
  getUserBlogFeed: GetUserBlogFeedEndpoint;
  getUserBlogObjectFilters: GetUserBlogObjectFiltersEndpoint;
  getUserMentionsFeed: GetUserMentionsFeedEndpoint;
  getUserThreadsFeed: GetUserThreadsFeedEndpoint;
  getUserCommentsFeed: GetUserCommentsFeedEndpoint;
  getUserActivity: GetUserActivityEndpoint;
  getUserWaivWallet: GetUserWaivWalletEndpoint;
  getUserWaivWalletHistory: GetUserWaivWalletHistoryEndpoint;
  getUserEngineWallet: GetUserEngineWalletEndpoint;
  getUserEngineWalletHistory: GetUserEngineWalletHistoryEndpoint;
  getUserEngineSwapList: GetUserEngineSwapListEndpoint;
  postUserEngineSwapQuote: PostUserEngineSwapQuoteEndpoint;
  getUserEngineDepositAddress: GetUserEngineDepositAddressEndpoint;
  postUserEngineWithdrawQuote: PostUserEngineWithdrawQuoteEndpoint;
  getUserEngineTokenDelegations: GetUserEngineTokenDelegationsEndpoint;
  getUserHiveHpDelegations: GetUserHiveHpDelegationsEndpoint;
  getUserHiveRcDelegations: GetUserHiveRcDelegationsEndpoint;
  getHiveAdvancedReport: GetHiveAdvancedReportEndpoint;
  upsertHiveWalletExemption: UpsertHiveWalletExemptionEndpoint;
  getUserFollowers: GetUserFollowersEndpoint;
  getUserFollowing: GetUserFollowingEndpoint;
  getUserFollowingObjects: GetUserFollowingObjectsEndpoint;
  getUserFavoritesTypes: GetUserFavoritesTypesEndpoint;
  getUserFavorites: GetUserFavoritesEndpoint;
  postUserFavoritesMap: PostUserFavoritesMapEndpoint;
  getUserExpertiseCounters: GetUserExpertiseCountersEndpoint;
  getUserExpertiseObjects: GetUserExpertiseObjectsEndpoint;
  getUserCategories: GetUserCategoriesEndpoint;
  getCategoryObjects: GetCategoryObjectsEndpoint;
  getUserShopObjects: GetUserShopObjectsEndpoint;
  getUserShopSections: GetUserShopSectionsEndpoint;
  getUserShopFilters: GetUserShopFiltersEndpoint;
  getPostByKey: GetPostByKeyEndpoint;
  getPostDiscussion: GetPostDiscussionEndpoint;
  getPostVoters: GetPostVotersEndpoint;
  currencyQueries: CurrencyQueryService;
  oblOffers: OblOffersService;
  oblLedger: OblLedgerService;
  oblConversion: OblConversionService;
  oblRelationships: OblRelationshipsService;
}
