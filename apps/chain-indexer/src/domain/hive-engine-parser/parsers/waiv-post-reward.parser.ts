import { Injectable } from '@nestjs/common';
import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
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
    const blockTimestampUnix = Math.floor(Date.parse(block.timestamp) / 1000);
    const ts = Number.isFinite(blockTimestampUnix)
      ? blockTimestampUnix
      : Math.floor(Date.now() / 1000);

    if (votes.length > 0) {
      await this.waivPostRewardService.handleVotes(votes, ts);
    }
    if (rewards.length > 0) {
      await this.waivPostRewardService.handleRewards(rewards);
    }
  }
}
