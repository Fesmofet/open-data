import { Injectable, Logger } from '@nestjs/common';
import { HiveEngineClient, RedisClientFactory } from '@opden-data-layer/clients';
import { WAIV_TOKEN } from '@opden-data-layer/core';
import { chainIndexerRedisKey } from '../constants/chain-indexer-redis-keys';

const WAIV_REWARD_POOL_CACHE_TTL_SEC = 60;

@Injectable()
export class WaivRewardPoolCache {
  private readonly logger = new Logger(WaivRewardPoolCache.name);

  constructor(
    private readonly hiveEngineClient: HiveEngineClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getRewardRate(): Promise<number> {
    const key = chainIndexerRedisKey.waivRewardPool();
    const redis = this.redisFactory.getClient(0);
    try {
      const cached = await redis.get(key);
      if (cached) {
        const rate = parseFloat(cached);
        if (Number.isFinite(rate) && rate >= 0) {
          return rate;
        }
      }
    } catch (e) {
      this.logger.warn(
        `waiv reward pool cache read failed: ${(e as Error).message}`,
      );
    }

    const pool = await this.hiveEngineClient.findOneRewardPool({
      _id: WAIV_TOKEN.REWARD_POOL_ID,
    });
    const rewardPool = parseFloat(pool?.rewardPool ?? '0');
    const pendingClaims = parseFloat(pool?.pendingClaims ?? '1');
    const rate =
      pendingClaims > 0 && Number.isFinite(rewardPool)
        ? rewardPool / pendingClaims
        : 0;

    try {
      await redis.set(key, String(rate), WAIV_REWARD_POOL_CACHE_TTL_SEC);
    } catch (e) {
      this.logger.warn(
        `waiv reward pool cache write failed: ${(e as Error).message}`,
      );
    }
    return rate;
  }
}
