import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { WAIV_REWARD_EVENT_DEDUP_TTL_SEC } from '../../constants/waiv-reward.constants';
import { redisKey } from '../../constants/redis-keys';

@Injectable()
export class WaivRewardEventDedupCache {
  private readonly logger = new Logger(WaivRewardEventDedupCache.name);

  constructor(private readonly redisFactory: RedisClientFactory) {}

  /**
   * Returns true when this reward event was not processed before (claim succeeded).
   * On Redis errors, fails open (returns true) so rewards are not dropped.
   */
  async claimOnce(
    heTransactionId: string,
    event: string,
    authorperm: string,
  ): Promise<boolean> {
    const key = redisKey.waivRewardEventDedup(
      heTransactionId,
      event,
      authorperm,
    );
    try {
      const redis = this.redisFactory.getClient(0);
      return await redis.trySetNx(key, '1', WAIV_REWARD_EVENT_DEDUP_TTL_SEC);
    } catch (e) {
      this.logger.warn(
        `waiv reward event dedup failed for ${heTransactionId}: ${
          (e as Error).message
        }`,
      );
      return true;
    }
  }
}
