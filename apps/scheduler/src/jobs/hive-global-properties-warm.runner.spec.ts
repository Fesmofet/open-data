import type { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { queryApiRedisKey } from '../constants/query-api-redis-keys';
import type { JobHandlerContext } from './cron-job.types';
import { HiveGlobalPropertiesWarmRunner } from './hive-global-properties-warm.runner';

function ctx(aborted = false): JobHandlerContext {
  return {
    jobName: 'hive-global-properties-warm',
    runId: 'run-1',
    attempt: 1,
    payload: null,
    signal: { aborted } as AbortSignal,
  };
}

describe('HiveGlobalPropertiesWarmRunner', () => {
  let getDynamicGlobalProperties: jest.Mock;
  let redisSet: jest.Mock;
  let runner: HiveGlobalPropertiesWarmRunner;

  beforeEach(() => {
    getDynamicGlobalProperties = jest.fn();
    redisSet = jest.fn().mockResolvedValue(undefined);
    const hiveClient = {
      getDynamicGlobalProperties,
    } as unknown as HiveClient;
    const redisFactory = {
      getClient: () => ({ set: redisSet }),
    } as unknown as RedisClientFactory;
    runner = new HiveGlobalPropertiesWarmRunner(hiveClient, redisFactory);
  });

  it('writes mapped chain context to the query-api cache key with TTL', async () => {
    getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '1000 VESTS',
      total_vesting_fund_hive: '500 HIVE',
      hbd_interest_rate: 2000,
    });

    await runner.run(ctx());

    expect(redisSet).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith(
      queryApiRedisKey.hiveGlobalProperties(),
      JSON.stringify({
        totalVestingShares: '1000 VESTS',
        totalVestingFundSteem: '500 HIVE',
        hbdInterestRatePercent: 20,
      }),
      1200,
    );
  });

  it('falls back to legacy steem fund field and zero interest', async () => {
    getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '1 VESTS',
      total_vesting_fund_steem: '2 STEEM',
    });

    await runner.run(ctx());

    expect(redisSet).toHaveBeenCalledWith(
      queryApiRedisKey.hiveGlobalProperties(),
      JSON.stringify({
        totalVestingShares: '1 VESTS',
        totalVestingFundSteem: '2 STEEM',
        hbdInterestRatePercent: 0,
      }),
      1200,
    );
  });

  it('skips cache write when properties are unavailable', async () => {
    getDynamicGlobalProperties.mockResolvedValue(undefined);

    await runner.run(ctx());

    expect(redisSet).not.toHaveBeenCalled();
  });

  it('does nothing when the job is already aborted', async () => {
    await runner.run(ctx(true));

    expect(getDynamicGlobalProperties).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });
});
