import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { GovernanceModule } from '../governance';
import { ObjectProjectionModule } from '../object-projection';
import { RepositoriesModule } from '../../repositories';
import { GetPostByKeyEndpoint } from './get-post-by-key.endpoint';
import { GetPostDiscussionEndpoint } from './get-post-discussion.endpoint';
import { GetPostVotersEndpoint } from './get-post-voters.endpoint';
import { PostRewardRatesCache } from './post-reward-rates.cache';
import { HiveGlobalPropertiesCache } from './hive-global-properties.cache';
import { PostRewardService } from './post-reward.service';
import { GetObjectPostsFeedEndpoint } from './get-object-posts-feed.endpoint';
import { GetObjectThreadsFeedEndpoint } from './get-object-threads-feed.endpoint';
import { GetUserBlogFeedEndpoint } from './get-user-blog-feed.endpoint';
import { GetUserBlogObjectFiltersEndpoint } from './get-user-blog-object-filters.endpoint';
import { GetUserCommentsFeedEndpoint } from './get-user-comments-feed.endpoint';
import { GetUserMentionsFeedEndpoint } from './get-user-mentions-feed.endpoint';
import { GetUserThreadsFeedEndpoint } from './get-user-threads-feed.endpoint';
import { GetUserActivityEndpoint } from './get-user-activity.endpoint';
import { HiveAccountHistoryPagerService } from './hive-account-history-pager.service';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, GovernanceModule, ObjectProjectionModule],
  providers: [
    GetObjectPostsFeedEndpoint,
    GetObjectThreadsFeedEndpoint,
    GetUserBlogFeedEndpoint,
    GetUserBlogObjectFiltersEndpoint,
    GetUserThreadsFeedEndpoint,
    GetUserCommentsFeedEndpoint,
    GetUserMentionsFeedEndpoint,
    GetUserActivityEndpoint,
    HiveAccountHistoryPagerService,
    GetPostByKeyEndpoint,
    GetPostDiscussionEndpoint,
    GetPostVotersEndpoint,
    PostRewardRatesCache,
    HiveGlobalPropertiesCache,
    PostRewardService,
  ],
  exports: [
    GetObjectPostsFeedEndpoint,
    GetObjectThreadsFeedEndpoint,
    GetUserBlogFeedEndpoint,
    GetUserBlogObjectFiltersEndpoint,
    GetUserThreadsFeedEndpoint,
    GetUserCommentsFeedEndpoint,
    GetUserMentionsFeedEndpoint,
    GetUserActivityEndpoint,
    GetPostByKeyEndpoint,
    GetPostDiscussionEndpoint,
    GetPostVotersEndpoint,
    PostRewardRatesCache,
    HiveGlobalPropertiesCache,
    PostRewardService,
  ],
})
export class FeedModule {}
