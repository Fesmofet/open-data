import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { isWaivRewardEligible } from '@opden-data-layer/core';
import type { Database } from '../../database';
import { KYSELY } from '../../database';
import { PostSyncQueueRepository } from '../../repositories/post-sync-queue.repository';
import { PostsRepository } from '../../repositories/posts.repository';
import { PostWaivReconcileQueue } from './post-waiv-reconcile.queue';
import type { WaivEngineRewardEvent, WaivEngineVoteEvent } from './waiv-post-reward.types';
import {
  computeNetRsharesWaiv,
  isPostCashout,
  parseAuthorPerm,
} from './waiv-post-reward.util';
import { WaivRewardEventDedupCache } from './waiv-reward-event-dedup.cache';
import { WaivRewardPoolCache } from './waiv-reward-pool.cache';
import { WAIV_HE_REWARD_EVENTS } from '../../constants/waiv-reward.constants';
import { OblPaymentAttributionService } from '../obl-parser/obl-payment-attribution.service';

@Injectable()
export class WaivPostRewardService {
  private readonly logger = new Logger(WaivPostRewardService.name);

  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly postsRepository: PostsRepository,
    private readonly postSyncQueueRepository: PostSyncQueueRepository,
    private readonly poolCache: WaivRewardPoolCache,
    private readonly reconcileQueue: PostWaivReconcileQueue,
    private readonly rewardDedupCache: WaivRewardEventDedupCache,
    private readonly oblPayments: OblPaymentAttributionService,
  ) {}

  async handleVotes(votes: WaivEngineVoteEvent[], blockTimestampUnix: number): Promise<void> {
    for (const vote of votes) {
      await this.handleVote(vote, blockTimestampUnix);
    }
  }

  async handleRewards(rewards: WaivEngineRewardEvent[]): Promise<void> {
    for (const reward of rewards) {
      await this.handleReward(reward);
    }
  }

  private async handleVote(
    vote: WaivEngineVoteEvent,
    blockTimestampUnix: number,
  ): Promise<void> {
    const { author, permlink, voter, weight, rshares } = vote;
    const post = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    if (!post) {
      await this.postSyncQueueRepository.enqueue(
        author,
        permlink,
        blockTimestampUnix,
        true,
      );
      await this.reconcileQueue.markDirty(author, permlink, blockTimestampUnix);
      return;
    }

    if (!isWaivRewardEligible(post.json_metadata)) {
      return;
    }

    const paid = isPostCashout(post.cashout_time);
    const updatePayoutFields = !paid;
    let rate = 0;
    if (updatePayoutFields) {
      rate = await this.poolCache.getRewardRate();
    }

    const applied = await this.db.transaction().execute(async (trx) => {
      const locked = await this.postsRepository.findRootPostForUpdate(
        author,
        permlink,
        trx,
      );
      if (!locked) {
        return false;
      }

      const storedVotes = await this.postsRepository.findActiveVotes(
        author,
        permlink,
        trx,
      );
      const voteInPost = storedVotes.find((v) => v.voter === voter);
      const previousRshares = voteInPost?.rshares_waiv ?? 0;

      let netRsharesWaiv = locked.net_rshares_waiv ?? 0;
      let totalPayoutWaiv = locked.total_payout_waiv ?? 0;

      if (updatePayoutFields) {
        netRsharesWaiv = computeNetRsharesWaiv(
          netRsharesWaiv,
          previousRshares,
          rshares,
          weight,
        );
        totalPayoutWaiv = Math.max(0, netRsharesWaiv * rate);
      }

      return this.postsRepository.applyWaivVoteUpdate(
        {
          author,
          permlink,
          voter,
          rsharesWaiv: weight === 0 ? 0 : rshares,
          weight,
          percent: weight / 100,
          netRsharesWaiv,
          totalPayoutWaiv,
          updatePayoutFields,
        },
        trx,
      );
    });

    if (!applied) {
      this.logger.warn(`WAIV vote skipped: root post missing ${author}/${permlink}`);
      return;
    }

    await this.reconcileQueue.markDirty(author, permlink, blockTimestampUnix);
  }

  private async handleReward(reward: WaivEngineRewardEvent): Promise<void> {
    const parsed = parseAuthorPerm(reward.authorperm);
    if (!parsed) {
      return;
    }
    const { author, permlink } = parsed;

    const first = await this.rewardDedupCache.claimOnce(
      reward.heTransactionId,
      reward.event,
      reward.authorperm,
    );
    if (!first) {
      return;
    }

    const post = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    if (!post) {
      return;
    }
    if (post.rewards_finalized_at) {
      return;
    }
    const ok = await this.postsRepository.incrementWaivRewards(
      author,
      permlink,
      reward.quantity,
    );
    if (!ok) {
      this.logger.warn(
        `WAIV reward skipped: root post missing ${author}/${permlink}`,
      );
      return;
    }

    if (reward.event === WAIV_HE_REWARD_EVENTS.CURATION_REWARD && reward.account) {
      await this.oblPayments.recordUpvoteReward({
        voter: reward.account,
        author,
        symbol: reward.symbol,
        quantity: reward.quantity,
        authorperm: reward.authorperm,
        heTransactionId: reward.heTransactionId,
        refHiveBlockNumber: reward.refHiveBlockNumber,
        trxIndex: reward.trxIndex,
        logIndex: reward.logIndex,
      });
    }
  }
}
