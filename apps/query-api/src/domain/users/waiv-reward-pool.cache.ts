import { Injectable, Logger } from '@nestjs/common';
import { HiveEngineClient, RedisClientFactory } from '@opden-data-layer/clients';
import { WAIV_TOKEN } from '@opden-data-layer/core';

import { WAIV_REWARD_POOL_CACHE_TTL_SEC } from '../../constants/cache.constants';
import { redisKey } from '../../constants/redis-keys';

@Injectable()
export class WaivRewardPoolCache {
  private readonly logger = new Logger(WaivRewardPoolCache.name);

  constructor(
    private readonly hiveEngineClient: HiveEngineClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getRewardRate(): Promise<number> {
    const key = redisKey.waivRewardPool();
    const redis = this.redisFactory.getClient(0);
    try {
      const cached = await redis.get(key);
      if (cached) {
        const rate = Number.parseFloat(cached);
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
    const rewardPool = Number.parseFloat(pool?.rewardPool ?? '0');
    const pendingClaims = Number.parseFloat(pool?.pendingClaims ?? '1');
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
