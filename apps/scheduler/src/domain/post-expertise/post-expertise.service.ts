import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Post } from '@opden-data-layer/core';
import {
  calculatePostExpertiseDeltas,
  type PostObjectExpertiseShare,
} from '@opden-data-layer/core';
import { KYSELY, type Database } from '../../database';
import { HiveEngineRatesRepository } from '../../repositories/hive-engine-rates.repository';
import { PostExpertiseRepository } from '../../repositories/post-expertise.repository';
import { PostObjectsRepository } from '../../repositories/post-objects.repository';
import { PostsRewardRepository } from '../../repositories/posts-reward.repository';

@Injectable()
export class PostExpertiseService {
  private readonly logger = new Logger(PostExpertiseService.name);

  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly postsRepository: PostsRewardRepository,
    private readonly postObjectsRepository: PostObjectsRepository,
    private readonly postExpertiseRepository: PostExpertiseRepository,
    private readonly hiveEngineRatesRepository: HiveEngineRatesRepository,
  ) {}

  async applyForPost(author: string, permlink: string): Promise<boolean> {
    const post = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    if (!post) {
      return false;
    }
    if (post.expertise_applied_at) {
      return false;
    }
    if (!post.rewards_finalized_at) {
      return false;
    }

    try {
      return await this.applyForPostRow(post);
    } catch (e) {
      this.logger.error(
        `apply expertise failed ${author}/${permlink}: ${(e as Error).message}`,
      );
      return false;
    }
  }

  async applyForPostRow(post: Post): Promise<boolean> {
    if (post.expertise_applied_at || !post.rewards_finalized_at) {
      return false;
    }

    const objectRows = await this.postObjectsRepository.findSharesByPost(
      post.author,
      post.permlink,
    );
    const shares: PostObjectExpertiseShare[] = objectRows
      .filter((row) => (row.percent ?? 0) > 0)
      .map((row) => ({
        objectId: row.object_id,
        percent: row.percent ?? 0,
      }));

    const waivUsdRate = await this.hiveEngineRatesRepository.resolveWaivUsdRateAtDate(
      post.last_payout,
    );

    const deltas =
      shares.length > 0
        ? calculatePostExpertiseDeltas(
            {
              pendingPayoutValue: post.pending_payout_value,
              totalPayoutValue: post.total_payout_value,
              curatorPayoutValue: post.curator_payout_value,
              maxAcceptedPayout: post.max_accepted_payout,
              totalPayoutWaiv: post.total_payout_waiv,
              totalRewardsWaiv: post.total_rewards_waiv,
              createdUnix: post.created_unix,
            },
            waivUsdRate,
            shares,
          )
        : [];

    return this.db.transaction().execute(async (trx) => {
      const claimed = await this.postExpertiseRepository.claimExpertiseApplied(
        post.author,
        post.permlink,
        trx,
      );
      if (!claimed) {
        return false;
      }

      if (deltas.length > 0) {
        await this.postExpertiseRepository.applyExpertiseIncrements(
          post.author,
          deltas,
          trx,
        );
      }

      return true;
    });
  }
}
