import { Injectable } from '@nestjs/common';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  AccountsCurrentRepository,
  PostsRepository,
  type FeedBranchRow,
} from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { ObjectProjectionService } from '../object-projection';
import { decodeFeedCursor, encodeFeedCursor } from './feed-cursor';
import { buildFeedStoryItemsFromPostPage } from './build-feed-story-items-from-post-page';
import type { FeedStoryItemDto, UserBlogFeedResponse } from './feed-story-dtos';
import { PostRewardService } from './post-reward.service';
import type { UserBlogFeedBody } from './schemas/user-blog-feed.schema';

export type { FeedStoryItemDto, FeedVoteSummaryDto, UserBlogFeedResponse } from './feed-story-dtos';

@Injectable()
export class GetUserBlogFeedEndpoint {
  constructor(
    private readonly postsRepo: PostsRepository,
    private readonly accounts: AccountsCurrentRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly objectProjection: ObjectProjectionService,
    private readonly postRewardService: PostRewardService,
  ) {}

  async execute(
    accountName: string,
    body: UserBlogFeedBody,
    locale: string,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<UserBlogFeedResponse | null> {
    const accountRow = await this.accounts.findByName(accountName);
    if (!accountRow) {
      return null;
    }

    const limit = body.limit;
    const limitPlusOne = limit + 1;
    const cursorPayload = body.cursor ? decodeFeedCursor(body.cursor) : null;
    if (body.cursor && !cursorPayload) {
      return {
        items: [],
        cursor: null,
        hasMore: false,
      };
    }

    const feedRows = await this.postsRepo.findUserBlogFeed(
      accountName,
      cursorPayload,
      limitPlusOne,
      body.object_ids,
    );

    const hasMore = feedRows.length > limit;
    const pageRows: FeedBranchRow[] = hasMore ? feedRows.slice(0, limit) : feedRows;

    if (pageRows.length === 0) {
      return {
        items: [],
        cursor: null,
        hasMore: false,
      };
    }

    const items: FeedStoryItemDto[] = await buildFeedStoryItemsFromPostPage(
      {
        postsRepo: this.postsRepo,
        accounts: this.accounts,
        aggregatedObjectRepo: this.aggregatedObjectRepo,
        objectViewService: this.objectViewService,
        governanceResolver: this.governanceResolver,
        objectProjection: this.objectProjection,
        postRewardService: this.postRewardService,
      },
      pageRows,
      locale,
      governanceObjectIdFromHeader,
      viewerAccount,
      body.currency,
    );

    let nextCursor: string | null = null;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1];
      nextCursor = encodeFeedCursor({
        feedAt: Number(last.feed_at),
        author: last.author,
        permlink: last.permlink,
      });
    }

    return {
      items,
      cursor: nextCursor,
      hasMore,
    };
  }
}
