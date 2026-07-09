import { Injectable, Logger } from '@nestjs/common';
import type { HiveAccountType } from '@opden-data-layer/clients';
import { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { HIVE_ACCOUNTS_CACHE_TTL_SEC } from '../../constants/cache.constants';
import { redisKey } from '../../constants/redis-keys';

@Injectable()
export class HiveAccountsCache {
  private readonly logger = new Logger(HiveAccountsCache.name);

  /** In-flight fetches per account — dedupes concurrent profile + sidebar requests. */
  private readonly inFlight = new Map<string, Promise<HiveAccountType | null>>();

  constructor(
    private readonly hiveClient: HiveClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getAccount(name: string): Promise<HiveAccountType | null> {
    const normalized = name.trim().toLowerCase();
    if (normalized.length === 0) {
      return null;
    }

    const key = redisKey.hiveAccount(normalized);
    const cached = await this.readRedisJson<HiveAccountType>(key);
    if (cached != null) {
      return cached;
    }

    const pending = this.inFlight.get(normalized);
    if (pending) {
      return pending;
    }

    const fetchPromise = this.fetchAndCache(normalized, key);
    this.inFlight.set(normalized, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inFlight.delete(normalized);
    }
  }

  private async fetchAndCache(
    normalized: string,
    key: string,
  ): Promise<HiveAccountType | null> {
    const accounts = await this.hiveClient.getAccountsStrict([normalized]);
    const account = accounts[0] ?? null;
    if (account) {
      await this.writeRedisJson(key, account, HIVE_ACCOUNTS_CACHE_TTL_SEC);
    }
    return account;
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
        `hive accounts: corrupt cache for ${key}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  private async writeRedisJson(
    key: string,
    value: HiveAccountType,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redisFactory
        .getClient(0)
        .set(key, JSON.stringify(value), ttlSec);
    } catch (e) {
      this.logger.warn(
        `hive accounts: redis write failed for ${key}: ${(e as Error).message}`,
      );
    }
  }
}
