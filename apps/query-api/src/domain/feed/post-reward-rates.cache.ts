import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import {
  POST_REWARD_FIAT_RATES_CACHE_TTL_SEC,
  POST_REWARD_WAIV_HIVE_RATE_CACHE_TTL_SEC,
} from '../../constants/cache.constants';
import { redisKey } from '../../constants/redis-keys';

export type PostRewardRatesSnapshot = {
  waivUsdRate: number;
  fiatRates: Record<string, number>;
};

const FIAT_BASE = 'USD';

@Injectable()
export class PostRewardRatesCache {
  private readonly logger = new Logger(PostRewardRatesCache.name);

  constructor(
    private readonly currencyQuery: CurrencyQueryService,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getSnapshot(): Promise<PostRewardRatesSnapshot> {
    const [waivUsdRate, fiatRates] = await Promise.all([
      this.getWaivUsdRate(),
      this.getFiatRates(),
    ]);
    return { waivUsdRate, fiatRates };
  }

  private async getWaivUsdRate(): Promise<number> {
    const key = redisKey.postRewardWaivHiveRate();
    const cached = await this.readRedisNumber(key);
    if (cached != null) {
      return cached;
    }

    const waivRates = await this.currencyQuery.engineCurrent();
    const rate = waivRates?.USD ?? 0;
    await this.writeRedisNumber(key, rate, POST_REWARD_WAIV_HIVE_RATE_CACHE_TTL_SEC);
    return rate;
  }

  private async getFiatRates(): Promise<Record<string, number>> {
    const key = redisKey.postRewardFiatRates(FIAT_BASE);
    const cached = await this.readRedisJson<Record<string, number>>(key);
    if (cached != null) {
      return cached;
    }

    const rates = await this.currencyQuery.legacyRateLatest(
      FIAT_BASE,
      SUPPORTED_CURRENCIES.join(','),
    );
    await this.writeRedisJson(key, rates, POST_REWARD_FIAT_RATES_CACHE_TTL_SEC);
    return rates;
  }

  private async readRedisNumber(key: string): Promise<number | null> {
    try {
      const raw = await this.redisFactory.getClient(0).get(key);
      if (raw == null || raw === '') {
        return null;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
        this.logger.warn(`post reward rates: corrupt number cache for ${key}`);
        return null;
      }
      return parsed;
    } catch (e) {
      this.logger.warn(
        `post reward rates: redis read failed for ${key}: ${(e as Error).message}`,
      );
      return null;
    }
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
        `post reward rates: corrupt or unreadable cache for ${key}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  private async writeRedisNumber(
    key: string,
    value: number,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redisFactory
        .getClient(0)
        .set(key, JSON.stringify(value), ttlSec);
    } catch (e) {
      this.logger.warn(
        `post reward rates: redis write failed for ${key}: ${(e as Error).message}`,
      );
    }
  }

  private async writeRedisJson(
    key: string,
    value: Record<string, number>,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redisFactory
        .getClient(0)
        .set(key, JSON.stringify(value), ttlSec);
    } catch (e) {
      this.logger.warn(
        `post reward rates: redis write failed for ${key}: ${(e as Error).message}`,
      );
    }
  }
}
