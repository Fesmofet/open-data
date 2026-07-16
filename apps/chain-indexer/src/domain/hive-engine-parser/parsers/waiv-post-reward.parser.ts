import { Injectable } from '@nestjs/common';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { blockTimestampToUnixSeconds, hiveBlockTimestampToDate } from '@opden-data-layer/core';
import type { HiveEngineSubParser } from '../hive-engine-sub-parser.interface';
import { WaivPostRewardService } from '../waiv-post-reward.service';
import { extractWaivEventsFromTransactions } from '../waiv-post-reward.util';

/**
 * Tracks WAIV post rewards from Hive Engine `comments` contract (votes + payout events).
 *
 * @see docs/apps/chain-indexer/spec/waiv-post-reward.md
 */
@Injectable()
export class WaivPostRewardParser implements HiveEngineSubParser {
  constructor(private readonly waivPostRewardService: WaivPostRewardService) {}

  async parseBlock(block: HiveEngineBlock): Promise<void> {
    const txs: HiveEngineTransaction[] = [
      ...block.transactions,
      ...(block.virtualTransactions ?? []),
    ];
    const commentsTxs = txs.filter((tx) => tx.contract === 'comments');
    if (commentsTxs.length === 0) {
      return;
    }

    const { votes, rewards } = extractWaivEventsFromTransactions(commentsTxs);
    const blockTimestampUnix = blockTimestampToUnixSeconds(block.timestamp);
    const ts = blockTimestampUnix > 0
      ? blockTimestampUnix
      : Math.floor(Date.now() / 1000);

    if (votes.length > 0) {
      await this.waivPostRewardService.handleVotes(votes, ts);
    }
    if (rewards.length > 0) {
      await this.waivPostRewardService.handleRewards(
        rewards,
        hiveBlockTimestampToDate(block.timestamp),
      );
    }
  }
}
