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
  GetUserCommentsFeedEndpoint,
  GetUserMentionsFeedEndpoint,
  GetUserThreadsFeedEndpoint,
} from '../domain/feed';
import type { GetObjectUpdatesFeedEndpoint } from '../domain/object-updates/get-object-updates-feed.endpoint';
import type { GetUpdateVotersEndpoint } from '../domain/object-updates/get-update-voters.endpoint';
import type {
  CheckObjectExistsEndpoint,
  GetObjectAuthorityEndpoint,
  GetObjectByIdEndpoint,
  GetObjectFollowersEndpoint,
  GetObjectRefListEndpoint,
  GetNestedObjectsEndpoint,
} from '../domain/objects';
import type { GetSearchCountsEndpoint } from '../domain/search/get-search-counts.endpoint';
import type { GetSearchEndpoint } from '../domain/search/get-search.endpoint';
import type { GetUserCategoriesEndpoint } from '../domain/categories/get-user-categories.endpoint';
import type {
  GetUserShopObjectsEndpoint,
  GetUserShopSectionsEndpoint,
} from '../domain/shop';
import type {
  GetUserFollowersEndpoint,
  GetUserFollowingEndpoint,
  GetUserFollowingObjectsEndpoint,
} from '../domain/social';
import type { GetUserProfileEndpoint } from '../domain/users';

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
  getObjectFollowers: GetObjectFollowersEndpoint;
  getObjectAuthority: GetObjectAuthorityEndpoint;
  getObjectUpdatesFeed: GetObjectUpdatesFeedEndpoint;
  getUpdateVoters: GetUpdateVotersEndpoint;
  getUserProfile: GetUserProfileEndpoint;
  getUserBlogFeed: GetUserBlogFeedEndpoint;
  getUserBlogObjectFilters: GetUserBlogObjectFiltersEndpoint;
  getUserMentionsFeed: GetUserMentionsFeedEndpoint;
  getUserThreadsFeed: GetUserThreadsFeedEndpoint;
  getUserCommentsFeed: GetUserCommentsFeedEndpoint;
  getUserFollowers: GetUserFollowersEndpoint;
  getUserFollowing: GetUserFollowingEndpoint;
  getUserFollowingObjects: GetUserFollowingObjectsEndpoint;
  getUserCategories: GetUserCategoriesEndpoint;
  getUserShopObjects: GetUserShopObjectsEndpoint;
  getUserShopSections: GetUserShopSectionsEndpoint;
  getPostByKey: GetPostByKeyEndpoint;
  getPostDiscussion: GetPostDiscussionEndpoint;
  getPostVoters: GetPostVotersEndpoint;
  currencyQueries: CurrencyQueryService;
}
