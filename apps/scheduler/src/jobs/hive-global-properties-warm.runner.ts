import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { queryApiRedisKey } from '../constants/query-api-redis-keys';
import type { JobHandlerContext } from './cron-job.types';

/**
 * Cached shape read by query-api `HiveGlobalPropertiesCache` (`ActivityChainContextFields`).
 * Must stay byte-compatible with `apps/query-api/src/domain/feed/hive-global-properties.cache.ts`.
 */
type HiveGlobalPropertiesCacheValue = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
  hbdInterestRatePercent: number;
};

/**
 * TTL longer than the 5-minute refresh cadence so the warmed value survives
 * between runs (and a few missed runs). On prolonged scheduler downtime the key
 * expires and query-api falls back to its own lazy live RPC fetch.
 */
const HIVE_GLOBAL_PROPERTIES_WARM_TTL_SEC = 1200;

let runnerRef: HiveGlobalPropertiesWarmRunner | null = null;

function registerHiveGlobalPropertiesWarmRunner(
  r: HiveGlobalPropertiesWarmRunner,
): void {
  runnerRef = r;
}

export function getHiveGlobalPropertiesWarmRunner(): HiveGlobalPropertiesWarmRunner {
  if (!runnerRef) {
    throw new Error('HiveGlobalPropertiesWarmRunner is not registered yet');
  }
  return runnerRef;
}

@Injectable()
export class HiveGlobalPropertiesWarmRunner implements OnModuleInit {
  private readonly logger = new Logger(HiveGlobalPropertiesWarmRunner.name);

  constructor(
    private readonly hiveClient: HiveClient,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  onModuleInit(): void {
    registerHiveGlobalPropertiesWarmRunner(this);
  }

  async run(ctx: JobHandlerContext): Promise<void> {
    if (ctx.signal.aborted) {
      return;
    }

    const props = await this.hiveClient.getDynamicGlobalProperties();
    if (!props) {
      this.logger.warn(
        'hive-global-properties-warm: dynamic global properties unavailable; skipping cache write',
      );
      return;
    }

    const value: HiveGlobalPropertiesCacheValue = {
      totalVestingShares: props.total_vesting_shares ?? '0',
      totalVestingFundSteem:
        props.total_vesting_fund_hive ?? props.total_vesting_fund_steem ?? '0',
      hbdInterestRatePercent:
        typeof props.hbd_interest_rate === 'number'
          ? props.hbd_interest_rate / 100
          : 0,
    };

    if (ctx.signal.aborted) {
      return;
    }

    try {
      await this.redisFactory
        .getClient(0)
        .set(
          queryApiRedisKey.hiveGlobalProperties(),
          JSON.stringify(value),
          HIVE_GLOBAL_PROPERTIES_WARM_TTL_SEC,
        );
    } catch (e) {
      this.logger.error(
        `hive-global-properties-warm: redis write failed: ${(e as Error).message}`,
      );
      throw e;
    }
  }
}
