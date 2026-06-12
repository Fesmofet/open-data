import { Inject, Injectable } from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import type { Post, PostUpdate } from '@opden-data-layer/core';
import { KYSELY, type Database } from '../database';

export type HivePayoutFieldUpdate = Pick<
  PostUpdate,
  | 'pending_payout_value'
  | 'total_payout_value'
  | 'curator_payout_value'
  | 'total_pending_payout_value'
  | 'cashout_time'
  | 'last_payout'
  | 'net_rshares'
  | 'total_vote_weight'
>;

@Injectable()
export class PostsRewardRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findRootPostByAuthorPermlink(
    author: string,
    permlink: string,
  ): Promise<Post | undefined> {
    return this.db
      .selectFrom('posts')
      .selectAll()
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .where((eb) =>
        eb.or([eb('depth', '=', 0), eb('depth', 'is', null)]),
      )
      .executeTakeFirst();
  }

  async findRootPostsPendingRewardsFinalize(
    limit: number,
    delaySec: number,
  ): Promise<Post[]> {
    return this.db
      .selectFrom('posts')
      .selectAll()
      .where((eb) =>
        eb.or([eb('depth', '=', 0), eb('depth', 'is', null)]),
      )
      .where('rewards_finalized_at', 'is', null)
      .where('cashout_time', 'is not', null)
      .where(
        sql<boolean>`cashout_time::timestamptz < NOW() - (${delaySec} * INTERVAL '1 second')`,
      )
      .limit(limit)
      .execute();
  }

  async updateHivePayoutFields(
    author: string,
    permlink: string,
    fields: HivePayoutFieldUpdate,
  ): Promise<void> {
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    ) as HivePayoutFieldUpdate;
    if (Object.keys(patch).length === 0) {
      return;
    }
    await this.db
      .updateTable('posts')
      .set(patch)
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .execute();
  }

  async upsertWaivVoteRshares(
    author: string,
    permlink: string,
    voter: string,
    rsharesWaiv: number,
  ): Promise<void> {
    await this.db
      .insertInto('post_active_votes')
      .values({
        author,
        permlink,
        voter,
        weight: null,
        percent: null,
        rshares: null,
        rshares_waiv: rsharesWaiv,
      })
      .onConflict((oc) =>
        oc.columns(['author', 'permlink', 'voter']).doUpdateSet({
          rshares_waiv: rsharesWaiv,
        }),
      )
      .execute();
  }

  async updateWaivPayoutFields(
    author: string,
    permlink: string,
    netRsharesWaiv: number,
    totalPayoutWaiv: number,
  ): Promise<void> {
    await this.db
      .updateTable('posts')
      .set({
        net_rshares_waiv: netRsharesWaiv,
        total_payout_waiv: totalPayoutWaiv,
      })
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .execute();
  }

  async finalizePostRewards(
    author: string,
    permlink: string,
    totalRewardsWaiv: number,
    rewardsFinalizedAt: string,
  ): Promise<boolean> {
    const post = await this.findRootPostByAuthorPermlink(author, permlink);
    if (!post) {
      return false;
    }
    await this.db
      .updateTable('posts')
      .set({
        total_rewards_waiv: totalRewardsWaiv,
        rewards_finalized_at: rewardsFinalizedAt,
      })
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .execute();
    return true;
  }
}
