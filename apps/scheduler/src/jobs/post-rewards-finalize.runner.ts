import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HiveClient, HiveEngineHistoryClient } from '@opden-data-layer/clients';
import {
  isWaivRewardEligible,
  parseCashoutToUnix,
  sumWaivAuthorBeneficiaryFromHistory,
  WAIV_TOKEN,
  waivCashoutHistoryWindow,
} from '@opden-data-layer/core';
import type { JobHandlerContext } from './cron-job.types';
import { PostRewardsFinalizeQueue } from '../queues/post-rewards-finalize.queue';
import { PostsRewardRepository } from '../repositories/posts-reward.repository';
import { PostExpertiseService } from '../domain/post-expertise/post-expertise.service';

const WAIV_HISTORY_AUTHOR_BEN_OPS =
  'comments_authorReward,comments_beneficiaryReward';
const HISTORY_LIMIT = 50;

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

let runnerRef: PostRewardsFinalizeRunner | null = null;

function registerPostRewardsFinalizeRunner(r: PostRewardsFinalizeRunner): void {
  runnerRef = r;
}

export function getPostRewardsFinalizeRunnerForJob(): PostRewardsFinalizeRunner {
  if (!runnerRef) {
    throw new Error('PostRewardsFinalizeRunner is not registered yet');
  }
  return runnerRef;
}

@Injectable()
export class PostRewardsFinalizeRunner implements OnModuleInit {
  private readonly logger = new Logger(PostRewardsFinalizeRunner.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly postsRepository: PostsRewardRepository,
    private readonly hiveClient: HiveClient,
    private readonly historyClient: HiveEngineHistoryClient,
    private readonly finalizeQueue: PostRewardsFinalizeQueue,
    private readonly postExpertiseService: PostExpertiseService,
  ) {}

  onModuleInit(): void {
    registerPostRewardsFinalizeRunner(this);
  }

  private batchSize(): number {
    const raw = this.configService.get<number>(
      'postRewardsFinalize.batchSize',
      50,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 50;
  }

  async run(ctx: JobHandlerContext): Promise<void> {
    if (ctx.signal.aborted) {
      return;
    }
    const delaySec = this.configService.get<number>(
      'postRewardsFinalize.delaySec',
      900,
    );
    const batchSize = this.batchSize();
    const nowUnix = Math.floor(Date.now() / 1000);
    const dueThreshold = nowUnix - (Number.isFinite(delaySec) ? delaySec : 900);

    const fromQueue = await this.finalizeQueue.claimDue(nowUnix, batchSize);
    const seen = new Set<string>();
    const targets: Array<{ author: string; permlink: string }> = [];

    for (const item of fromQueue) {
      const key = `${item.author}:${item.permlink}`;
      if (!seen.has(key)) {
        seen.add(key);
        targets.push(item);
      }
    }

    const remaining = Math.max(0, batchSize - targets.length);
    if (remaining > 0) {
      const fromPg = await this.postsRepository.findRootPostsPendingRewardsFinalize(
        remaining,
        Number.isFinite(delaySec) ? delaySec : 900,
      );
      for (const post of fromPg) {
        const key = `${post.author}:${post.permlink}`;
        if (!seen.has(key)) {
          seen.add(key);
          targets.push({ author: post.author, permlink: post.permlink });
        }
      }
    }

    let processed = 0;
    for (const { author, permlink } of targets) {
      if (ctx.signal.aborted) {
        return;
      }
      try {
        const ok = await this.finalizePost(author, permlink, dueThreshold);
        if (ok) {
          processed += 1;
        }
      } catch (e) {
        this.logger.error(
          `finalize failed ${author}/${permlink}: ${(e as Error).message}`,
        );
      }
    }
    this.logger.log(`post-rewards-finalize: processed ${processed} post(s)`);
  }

  private async finalizePost(
    author: string,
    permlink: string,
    dueThresholdUnix: number,
  ): Promise<boolean> {
    const post = await this.postsRepository.findRootPostByAuthorPermlink(
      author,
      permlink,
    );
    if (!post || post.rewards_finalized_at) {
      await this.finalizeQueue.remove(author, permlink);
      return false;
    }

    const cashoutUnix = parseCashoutToUnix(post.cashout_time);
    if (cashoutUnix === null || cashoutUnix > dueThresholdUnix) {
      return false;
    }

    const hive = await this.hiveClient.getContent(author, permlink);
    if (!hive?.author) {
      this.logger.warn(`finalize: Hive content missing ${author}/${permlink}`);
      return false;
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

    let totalRewardsWaiv = post.total_rewards_waiv ?? 0;

    if (isWaivRewardEligible(post.json_metadata)) {
      const authorperm = `@${author}/${permlink}`;
      const { timestampStart, timestampEnd } = waivCashoutHistoryWindow(
        post.created_unix,
      );

      const authorBenAccounts = new Set<string>([post.author]);
      if (Array.isArray(post.beneficiaries)) {
        for (const b of post.beneficiaries) {
          const account = b.account?.trim();
          if (account) {
            authorBenAccounts.add(account);
          }
        }
      }

      const authorBenEntries = [];
      for (const account of authorBenAccounts) {
        const rows = await this.historyClient.accountHistory({
          account,
          symbol: WAIV_TOKEN.SYMBOL,
          ops: WAIV_HISTORY_AUTHOR_BEN_OPS,
          timestampStart,
          timestampEnd,
          limit: HISTORY_LIMIT,
        });
        authorBenEntries.push(...rows);
      }

      const historyPaid = sumWaivAuthorBeneficiaryFromHistory(
        authorBenEntries,
        authorperm,
      );
      if (historyPaid > 0) {
        totalRewardsWaiv = Math.max(totalRewardsWaiv, historyPaid);
      }
    }

    const rewardsFinalizedAt = new Date().toISOString();
    const ok = await this.postsRepository.finalizePostRewards(
      author,
      permlink,
      totalRewardsWaiv,
      rewardsFinalizedAt,
    );
    if (ok) {
      await this.finalizeQueue.remove(author, permlink);
      try {
        await this.postExpertiseService.applyForPost(author, permlink);
      } catch (e) {
        this.logger.error(
          `expertise apply after finalize failed ${author}/${permlink}: ${(e as Error).message}`,
        );
      }
    }
    return ok;
  }
}
