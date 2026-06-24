import { Injectable, Logger } from '@nestjs/common';
import { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { HIVE_GLOBAL_PROPERTIES_CACHE_TTL_SEC } from '../../constants/cache.constants';
import { redisKey } from '../../constants/redis-keys';

export type ActivityChainContextFields = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
  hbdInterestRatePercent: number;
};

const DEFAULT_CHAIN_CONTEXT: ActivityChainContextFields = {
  totalVestingShares: '0',
  totalVestingFundSteem: '0',
  hbdInterestRatePercent: 0,
};

@Injectable()
export class HiveGlobalPropertiesCache {
  private readonly logger = new Logger(HiveGlobalPropertiesCache.name);

  constructor(
    private readonly hiveClient: HiveClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async getChainContextFields(): Promise<ActivityChainContextFields> {
    const key = redisKey.hiveGlobalProperties();
    const cached = await this.readRedisJson<ActivityChainContextFields>(key);
    if (cached != null) {
      return { ...DEFAULT_CHAIN_CONTEXT, ...cached };
    }

    const fields = await this.fetchFromHive();
    await this.writeRedisJson(key, fields, HIVE_GLOBAL_PROPERTIES_CACHE_TTL_SEC);
    return fields;
  }

  private async fetchFromHive(): Promise<ActivityChainContextFields> {
    const props = await this.hiveClient.getDynamicGlobalProperties();
    if (!props) {
      return DEFAULT_CHAIN_CONTEXT;
    }
    return {
      totalVestingShares:
        props.total_vesting_shares ?? DEFAULT_CHAIN_CONTEXT.totalVestingShares,
      totalVestingFundSteem:
        props.total_vesting_fund_hive ??
        props.total_vesting_fund_steem ??
        DEFAULT_CHAIN_CONTEXT.totalVestingFundSteem,
      hbdInterestRatePercent:
        typeof props.hbd_interest_rate === 'number'
          ? props.hbd_interest_rate / 100
          : DEFAULT_CHAIN_CONTEXT.hbdInterestRatePercent,
    };
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
        `hive global properties: corrupt or unreadable cache for ${key}: ${(e as Error).message}`,
      );
      return null;
    }
  }

  private async writeRedisJson(
    key: string,
    value: ActivityChainContextFields,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redisFactory
        .getClient(0)
        .set(key, JSON.stringify(value), ttlSec);
    } catch (e) {
      this.logger.warn(
        `hive global properties: redis write failed for ${key}: ${(e as Error).message}`,
      );
    }
  }
}
