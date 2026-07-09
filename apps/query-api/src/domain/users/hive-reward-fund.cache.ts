import { Injectable, Logger } from '@nestjs/common';
import { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { HIVE_REWARD_FUND_CACHE_TTL_SEC } from '../../constants/cache.constants';
import { redisKey } from '../../constants/redis-keys';

export type HiveRewardFundSnapshot = {
  rewardBalance: number;
  recentClaims: number;
  rewardPerClaim: number;
};

@Injectable()
export class HiveRewardFundCache {
  private readonly logger = new Logger(HiveRewardFundCache.name);

  constructor(
    private readonly hiveClient: HiveClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getRewardPerClaim(): Promise<HiveRewardFundSnapshot> {
    const key = redisKey.hiveRewardFund();
    const cached = await this.readRedisJson<HiveRewardFundSnapshot>(key);
    if (cached != null) {
      return cached;
    }

    const snapshot = await this.fetchFromHive();
    await this.writeRedisJson(key, snapshot, HIVE_REWARD_FUND_CACHE_TTL_SEC);
    return snapshot;
  }

  private async fetchFromHive(): Promise<HiveRewardFundSnapshot> {
    const fund = await this.hiveClient.getRewardFund('post');
    const rewardBalance = parseAssetNumber(fund?.reward_balance);
    const recentClaims = parseAssetNumber(fund?.recent_claims);
    const rewardPerClaim =
      recentClaims > 0 && rewardBalance > 0 ? rewardBalance / recentClaims : 0;
    return { rewardBalance, recentClaims, rewardPerClaim };
  }

  private async readRedisJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisFactory.getClient(0).get(key);
      if (raw == null || raw === '') {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.warn(
        `hive reward fund: corrupt cache for ${key}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  private async writeRedisJson(
    key: string,
    value: HiveRewardFundSnapshot,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redisFactory
        .getClient(0)
        .set(key, JSON.stringify(value), ttlSec);
    } catch (e) {
      this.logger.warn(
        `hive reward fund: redis write failed for ${key}: ${(e as Error).message}`,
      );
    }
  }
}

function parseAssetNumber(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
