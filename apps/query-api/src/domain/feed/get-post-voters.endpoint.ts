import { Injectable } from '@nestjs/common';
import type { ActiveVotesType } from '@opden-data-layer/clients';
import { HiveClient } from '@opden-data-layer/clients';
import { SupportedCurrency } from '@opden-data-layer/core';
import { moneyLineFromUsd } from '@opden-data-layer/currency';
import { Post } from '@opden-data-layer/odl-db-types';

import {
  AccountsCurrentRepository,
  PostsRepository,
  ThreadsRepository,
  type PostVoterDbRow,
  type VoteDirection,
} from '../../repositories';
import { mapAccountToUserProfileView } from '../users/account-mapper';
import {
  buildVoteValueContextFromPost,
  buildVoteValueContextFromThread,
} from './build-vote-value-context';
import {
  calculateVoteValueUsd,
  isDownvote,
  isUpvote,
  type VoteValuePostContext,
} from './calculate-vote-value-usd';
import { buildPostRewardInputFromHiveContent } from './build-post-reward-input';
import { VOTERS_PAGE_LIMIT } from './feed.constants';
import type { PostVoterRowDto, PostVotersPageDto } from './feed-story-dtos';
import { PostRewardRatesCache } from './post-reward-rates.cache';
import type { PostVotersQuery } from './schemas/post-voters.schema';
import { formatVoteWeightPercent } from './format-vote-weight-percent';
import {
  sliceVotersAfterCursor,
  sortVotersByValueUsd,
  voterValueSortKey,
} from './sort-voters-by-value';
import {
  decodeVotersCursor,
  encodeVotersCursor,
  type VotersPageCursor,
} from './voters-cursor';

type VoterSourceRow = {
  voter: string;
  percent: number | null;
  weight: number | null;
  rshares: number;
  rsharesWaiv: number;
};

@Injectable()
export class GetPostVotersEndpoint {
  constructor(
    private readonly postsRepo: PostsRepository,
    private readonly threadsRepo: ThreadsRepository,
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveClient: HiveClient,
    private readonly ratesCache: PostRewardRatesCache,
  ) {}

  async execute(
    author: string,
    permlink: string,
    query: PostVotersQuery,
    currency: SupportedCurrency,
  ): Promise<PostVotersPageDto | null> {
    const direction = query.direction;
    const limit = query.limit ?? VOTERS_PAGE_LIMIT;
    const cursor = decodeVotersCursor(query.cursor);

    if (query.contentType === 'thread') {
      return this.executeForThread(author, permlink, direction, limit, cursor, currency);
    }

    return this.executeForPost(author, permlink, direction, limit, cursor, currency);
  }

  private async executeForPost(
    author: string,
    permlink: string,
    direction: VoteDirection,
    limit: number,
    cursor: VotersPageCursor | null,
    currency: SupportedCurrency,
  ): Promise<PostVotersPageDto | null> {
    const counts = await this.postsRepo.findPostVoterCounts(author, permlink);
    const postRows = await this.postsRepo.findPostsByKeys([{ author, permlink }]);
    const post = postRows[0];

    const dbRows = await this.postsRepo.findPostVotersByDirection(
      author,
      permlink,
      direction,
    );

    if (dbRows.length > 0 || counts.upvoteCount + counts.downvoteCount > 0) {
      if (!post) {
        return this.emptyPage(counts.upvoteCount, counts.downvoteCount);
      }
      const context = buildVoteValueContextFromPost(
        post,
        counts.totalHiveRsharesSum,
        counts.totalWaivRsharesSum,
      );
      return this.mapSourcePage(
        dbRows.map(dbRowToSource),
        limit,
        cursor,
        counts,
        context,
        currency,
      );
    }

    return this.executeHiveFallback(
      author,
      permlink,
      direction,
      limit,
      cursor,
      currency,
      post,
      counts.upvoteCount,
      counts.downvoteCount,
    );
  }

  private async executeForThread(
    author: string,
    permlink: string,
    direction: VoteDirection,
    limit: number,
    cursor: VotersPageCursor | null,
    currency: SupportedCurrency,
  ): Promise<PostVotersPageDto | null> {
    const thread = await this.threadsRepo.findThreadByKey(author, permlink);
    if (!thread) {
      return null;
    }

    const counts = await this.threadsRepo.findThreadVoterCounts(author, permlink);
    const dbRows = await this.threadsRepo.findThreadVotersByDirection(
      author,
      permlink,
      direction,
    );

    const context = buildVoteValueContextFromThread(
      thread,
      counts.totalHiveRsharesSum,
      counts.totalWaivRsharesSum,
    );
    return this.mapSourcePage(
      dbRows.map(dbRowToSource),
      limit,
      cursor,
      counts,
      context,
      currency,
    );
  }

  private async executeHiveFallback(
    author: string,
    permlink: string,
    direction: VoteDirection,
    limit: number,
    cursor: VotersPageCursor | null,
    currency: SupportedCurrency,
    post: Post | undefined,
    dbUp: number,
    dbDown: number,
  ): Promise<PostVotersPageDto | null> {
    const hiveVotes = await this.hiveClient.getActiveVotes(author, permlink);
    const hiveContent = post ? null : await this.hiveClient.getContent(author, permlink);
    if (!post && !hiveContent) {
      return null;
    }

    const totalRshares = sumHiveRshares(hiveVotes);
    let payoutContext: VoteValuePostContext;
    if (post) {
      payoutContext = buildVoteValueContextFromPost(post, totalRshares, 0);
    } else if (hiveContent) {
      payoutContext = this.hiveContentToVoteContext(hiveContent, hiveVotes);
    } else {
      return null;
    }

    const upvoteCount =
      dbUp > 0 ? dbUp : hiveVotes.filter((v) => isUpvote(v.percent, v.rshares ?? 0)).length;
    const downvoteCount =
      dbDown > 0 ? dbDown : hiveVotes.filter((v) => isDownvote(v.percent)).length;

    const filtered = hiveVotes
      .map((v) => hiveVoteToRow(v))
      .filter((v) =>
        direction === 'up'
          ? isUpvote(v.percent, v.rshares)
          : isDownvote(v.percent),
      );

    return this.mapSourcePage(
      filtered,
      limit,
      cursor,
      { upvoteCount, downvoteCount },
      payoutContext,
      currency,
    );
  }

  private hiveContentToVoteContext(
    content: NonNullable<Awaited<ReturnType<HiveClient['getContent']>>>,
    votes: ActiveVotesType[],
  ): VoteValuePostContext {
    const rewardInput = buildPostRewardInputFromHiveContent(content);
    return {
      pendingPayoutValue: rewardInput.pendingPayoutValue,
      totalPayoutValue: rewardInput.totalPayoutValue,
      curatorPayoutValue: rewardInput.curatorPayoutValue,
      cashoutTime: rewardInput.cashoutTime,
      totalPayoutWaiv: rewardInput.totalPayoutWaiv,
      totalRewardsWaiv: rewardInput.totalRewardsWaiv,
      netRsharesWaiv: 0,
      totalHiveRsharesSum: sumHiveRshares(votes),
      totalWaivRsharesSum: 0,
    };
  }

  private async mapSourcePage(
    rows: VoterSourceRow[],
    limit: number,
    cursor: VotersPageCursor | null,
    counts: { upvoteCount: number; downvoteCount: number },
    context: VoteValuePostContext,
    currency: SupportedCurrency,
  ): Promise<PostVotersPageDto> {
    const rates = await this.ratesCache.getSnapshot();

    const scored = sortVotersByValueUsd(
      rows.map((row) => ({
        row,
        valueUsd: calculateVoteValueUsd(
          context,
          { rshares: row.rshares, rsharesWaiv: row.rsharesWaiv },
          rates.waivUsdRate,
        ),
      })),
    );

    const afterCursor = sliceVotersAfterCursor(scored, cursor);
    const hasMore = afterCursor.length > limit;
    const pageScored = hasMore ? afterCursor.slice(0, limit) : afterCursor;

    const voterNames = pageScored.map((entry) => entry.row.voter);
    const accountRows = await this.accounts.findByNames(voterNames);
    const profileByName = new Map(
      accountRows.map((row) => [row.name, mapAccountToUserProfileView(row)]),
    );

    const items: PostVoterRowDto[] = pageScored.map((entry) => {
      const { row, valueUsd } = entry;
      const line = moneyLineFromUsd(valueUsd, currency, rates.fiatRates);
      const profile = profileByName.get(row.voter);
      return {
        voter: row.voter,
        percent: formatVoteWeightPercent(row.weight, row.percent),
        valueUsd,
        valueLabel: line.label,
        profile: {
          name: row.voter,
          displayName: profile?.displayName ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        },
      };
    });

    let nextCursor: string | null = null;
    if (hasMore && pageScored.length > 0) {
      const last = pageScored[pageScored.length - 1];
      nextCursor = encodeVotersCursor({
        sortKey: voterValueSortKey(last.valueUsd),
        voter: last.row.voter,
      });
    }

    return {
      upvoteCount: counts.upvoteCount,
      downvoteCount: counts.downvoteCount,
      items,
      nextCursor,
    };
  }

  private emptyPage(upvoteCount: number, downvoteCount: number): PostVotersPageDto {
    return {
      upvoteCount,
      downvoteCount,
      items: [],
      nextCursor: null,
    };
  }
}

function dbRowToSource(row: PostVoterDbRow): VoterSourceRow {
  return {
    voter: row.voter,
    percent: row.percent,
    weight: row.weight,
    rshares: Number(row.rshares ?? BigInt(0)),
    rsharesWaiv: row.rshares_waiv ?? 0,
  };
}

function hiveVoteToRow(vote: ActiveVotesType): VoterSourceRow {
  return {
    voter: vote.voter,
    percent: vote.percent,
    weight: vote.weight,
    rshares: vote.rshares ?? 0,
    rsharesWaiv: 0,
  };
}

function sumHiveRshares(votes: ActiveVotesType[]): number {
  return votes.reduce((sum, v) => sum + (v.rshares ?? 0), 0);
}
