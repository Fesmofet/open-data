import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { GovernanceModule } from '../governance';
import { ObjectProjectionModule } from '../object-projection';
import { RepositoriesModule } from '../../repositories';
import { GetPostByKeyEndpoint } from './get-post-by-key.endpoint';
import { GetPostDiscussionEndpoint } from './get-post-discussion.endpoint';
import { GetPostVotersEndpoint } from './get-post-voters.endpoint';
import { PostRewardRatesCache } from './post-reward-rates.cache';
import { PostRewardService } from './post-reward.service';
import { GetUserBlogFeedEndpoint } from './get-user-blog-feed.endpoint';
import { GetUserBlogObjectFiltersEndpoint } from './get-user-blog-object-filters.endpoint';
import { GetUserCommentsFeedEndpoint } from './get-user-comments-feed.endpoint';
import { GetUserMentionsFeedEndpoint } from './get-user-mentions-feed.endpoint';
import { GetUserThreadsFeedEndpoint } from './get-user-threads-feed.endpoint';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, GovernanceModule, ObjectProjectionModule],
  providers: [
    GetUserBlogFeedEndpoint,
    GetUserBlogObjectFiltersEndpoint,
    GetUserThreadsFeedEndpoint,
    GetUserCommentsFeedEndpoint,
    GetUserMentionsFeedEndpoint,
    GetPostByKeyEndpoint,
    GetPostDiscussionEndpoint,
    GetPostVotersEndpoint,
    PostRewardRatesCache,
    PostRewardService,
  ],
  exports: [
    GetUserBlogFeedEndpoint,
    GetUserBlogObjectFiltersEndpoint,
    GetUserThreadsFeedEndpoint,
    GetUserCommentsFeedEndpoint,
    GetUserMentionsFeedEndpoint,
    GetPostByKeyEndpoint,
    GetPostDiscussionEndpoint,
    GetPostVotersEndpoint,
    PostRewardRatesCache,
    PostRewardService,
  ],
})
export class FeedModule {}
