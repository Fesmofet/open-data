import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HiveClient, HiveEngineClient } from '@opden-data-layer/clients';
import { isWaivRewardEligible, WAIV_TOKEN } from '@opden-data-layer/core';
import type { JobHandlerContext } from './cron-job.types';
import { PostWaivReconcileQueue } from '../queues/post-waiv-reconcile.queue';
import { PostsRewardRepository } from '../repositories/posts-reward.repository';
import { WaivRewardPoolCache } from '../services/waiv-reward-pool.cache';

export class ReconcileHiveContentMissingError extends Error {
  constructor(author: string, permlink: string) {
    super(`Hive content missing for ${author}/${permlink}`);
    this.name = 'ReconcileHiveContentMissingError';
  }
}

function toBigIntVoteRshares(v: number | string | undefined | null): bigint {
  if (v === undefined || v === null) {
    return BigInt(0);
  }
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) {
    return BigInt(0);
  }
  return BigInt(Math.trunc(n));
}

let runnerRef: PostRewardReconcileRunner | null = null;

function registerPostRewardReconcileRunner(r: PostRewardReconcileRunner): void {
  runnerRef = r;
}

export function getPostRewardReconcileRunnerForJob(): PostRewardReconcileRunner {
  if (!runnerRef) {
    throw new Error('PostRewardReconcileRunner is not registered yet');
  }
  return runnerRef;
}

@Injectable()
export class PostRewardReconcileRunner implements OnModuleInit {
  private readonly logger = new Logger(PostRewardReconcileRunner.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly postsRepository: PostsRewardRepository,
    private readonly hiveClient: HiveClient,
    private readonly hiveEngineClient: HiveEngineClient,
    private readonly poolCache: WaivRewardPoolCache,
    private readonly reconcileQueue: PostWaivReconcileQueue,
  ) {}

  onModuleInit(): void {
    registerPostRewardReconcileRunner(this);
  }

  private batchSize(): number {
    const raw = this.configService.get<number>(
      'postRewardReconcile.batchSize',
      1000,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 1000;
  }

  async run(ctx: JobHandlerContext): Promise<void> {
    if (ctx.signal.aborted) {
      return;
    }
    const dirty = await this.reconcileQueue.claimNewest(this.batchSize());
    const seen = new Set<string>();
    for (const { author, permlink } of dirty) {
      if (ctx.signal.aborted) {
        return;
      }
      const key = `${author}:${permlink}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      try {
        await this.reconcilePost(author, permlink);
      } catch (e) {
        this.logger.error(
          `reconcile failed ${author}/${permlink}: ${(e as Error).message}`,
        );
        await this.reconcileQueue.touchDirty(author, permlink);
      }
    }
    this.logger.log(`waiv-post-reconcile: processed ${seen.size} post(s)`);
  }

  async reconcilePost(author: string, permlink: string): Promise<void> {
    const post = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    if (!post) {
      await this.reconcileQueue.remove(author, permlink);
      return;
    }

    if (post.rewards_finalized_at) {
      await this.reconcileQueue.remove(author, permlink);
      return;
    }

    const hive = await this.hiveClient.getContent(author, permlink);
    if (!hive?.author) {
      throw new ReconcileHiveContentMissingError(author, permlink);
    }

    await this.postsRepository.updateHivePayoutFields(author, permlink, {
      pending_payout_value: hive.pending_payout_value ?? post.pending_payout_value,
      total_payout_value: hive.total_payout_value ?? post.total_payout_value,
      curator_payout_value: hive.curator_payout_value ?? post.curator_payout_value,
      total_pending_payout_value:
        hive.total_pending_payout_value ?? post.total_pending_payout_value,
      cashout_time: hive.cashout_time ?? post.cashout_time,
      last_payout: hive.last_payout ?? post.last_payout,
      net_rshares: toBigIntVoteRshares(hive.net_rshares),
      total_vote_weight:
        hive.total_vote_weight !== undefined && hive.total_vote_weight !== null
          ? BigInt(Math.trunc(hive.total_vote_weight))
          : post.total_vote_weight,
    });

    if (!isWaivRewardEligible(post.json_metadata)) {
      await this.reconcileQueue.remove(author, permlink);
      return;
    }

    const authorperm = `@${author}/${permlink}`;
    const [enginePost, engineVotes, rate] = await Promise.all([
      this.hiveEngineClient.findOneCommentPost({
        authorperm,
        symbol: WAIV_TOKEN.SYMBOL,
      }),
      this.hiveEngineClient.findCommentVotes({
        query: { authorperm, symbol: WAIV_TOKEN.SYMBOL },
      }),
      this.poolCache.getRewardRate(),
    ]);

    for (const vote of engineVotes) {
      const rsharesWaiv = parseFloat(vote.rshares ?? '0');
      if (!Number.isFinite(rsharesWaiv)) {
        continue;
      }
      await this.postsRepository.upsertWaivVoteRshares(
        author,
        permlink,
        vote.voter,
        rsharesWaiv,
      );
    }

    if (enginePost) {
      const voteRshareSum = parseFloat(enginePost.voteRshareSum ?? '0');
      const netRsharesWaiv = Number.isFinite(voteRshareSum) ? voteRshareSum : 0;
      const totalPayoutWaiv = Math.max(0, netRsharesWaiv * rate);
      await this.postsRepository.updateWaivPayoutFields(
        author,
        permlink,
        netRsharesWaiv,
        totalPayoutWaiv,
      );
    }

    await this.reconcileQueue.remove(author, permlink);
  }
}
