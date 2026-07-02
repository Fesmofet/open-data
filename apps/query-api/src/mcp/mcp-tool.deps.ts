import type { CurrencyQueryService } from '@opden-data-layer/currency';
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
  GetObjectRefListEndpoint,
  GetObjectRelatedAlbumEndpoint,
  GetObjectRelatedAlbumPreviewEndpoint,
  GetNestedObjectsEndpoint,
} from '../domain/objects';
import type { GetSearchCountsEndpoint } from '../domain/search/get-search-counts.endpoint';
import type { GetSearchEndpoint } from '../domain/search/get-search.endpoint';
import type { GetUserCategoriesEndpoint } from '../domain/categories/get-user-categories.endpoint';
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
import type { GetUserProfileEndpoint } from '../domain/users';
import type {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserHiveHpDelegationsEndpoint,
  GetUserHiveRcDelegationsEndpoint,
  GetUserWaivWalletEndpoint,
  GetUserWaivWalletHistoryEndpoint,
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
  getObjectRelatedAlbumPreview: GetObjectRelatedAlbumPreviewEndpoint;
  getObjectRelatedAlbum: GetObjectRelatedAlbumEndpoint;
  getObjectFollowers: GetObjectFollowersEndpoint;
  getObjectAuthority: GetObjectAuthorityEndpoint;
  getObjectUpdatesFeed: GetObjectUpdatesFeedEndpoint;
  getObjectPostsFeed: GetObjectPostsFeedEndpoint;
  getUpdateVoters: GetUpdateVotersEndpoint;
  getUserProfile: GetUserProfileEndpoint;
  getUserBlogFeed: GetUserBlogFeedEndpoint;
  getUserBlogObjectFilters: GetUserBlogObjectFiltersEndpoint;
  getUserMentionsFeed: GetUserMentionsFeedEndpoint;
  getUserThreadsFeed: GetUserThreadsFeedEndpoint;
  getUserCommentsFeed: GetUserCommentsFeedEndpoint;
  getUserActivity: GetUserActivityEndpoint;
  getUserWaivWallet: GetUserWaivWalletEndpoint;
  getUserWaivWalletHistory: GetUserWaivWalletHistoryEndpoint;
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
  getUserCategories: GetUserCategoriesEndpoint;
  getUserShopObjects: GetUserShopObjectsEndpoint;
  getUserShopSections: GetUserShopSectionsEndpoint;
  getUserShopFilters: GetUserShopFiltersEndpoint;
  getPostByKey: GetPostByKeyEndpoint;
  getPostDiscussion: GetPostDiscussionEndpoint;
  getPostVoters: GetPostVotersEndpoint;
  currencyQueries: CurrencyQueryService;
}
