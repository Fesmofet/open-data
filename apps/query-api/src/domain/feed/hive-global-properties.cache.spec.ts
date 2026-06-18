import type { HiveClient, RedisClientFactory } from '@opden-data-layer/clients';

import { HIVE_GLOBAL_PROPERTIES_CACHE_TTL_SEC } from '../../constants/cache.constants';
import { HiveGlobalPropertiesCache } from './hive-global-properties.cache';

describe('HiveGlobalPropertiesCache', () => {
  const hiveClient: jest.Mocked<Pick<HiveClient, 'getDynamicGlobalProperties'>> = {
    getDynamicGlobalProperties: jest.fn(),
  };

  let redisGet: jest.Mock;
  let redisSet: jest.Mock;
  let cache: HiveGlobalPropertiesCache;

  beforeEach(() => {
    redisGet = jest.fn().mockResolvedValue(null);
    redisSet = jest.fn().mockResolvedValue(undefined);
    const redisFactory = {
      getClient: () => ({ get: redisGet, set: redisSet }),
    } as unknown as RedisClientFactory;
    cache = new HiveGlobalPropertiesCache(
      hiveClient as unknown as HiveClient,
      redisFactory,
    );
    jest.clearAllMocks();
    redisGet.mockResolvedValue(null);
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100 VESTS',
      total_vesting_fund_hive: '50 HIVE',
    });
  });

  it('returns cached chain context without calling Hive', async () => {
    redisGet.mockResolvedValueOnce(
      JSON.stringify({
        totalVestingShares: '200 VESTS',
        totalVestingFundSteem: '75 HIVE',
      }),
    );

    const fields = await cache.getChainContextFields();

    expect(fields).toEqual({
      totalVestingShares: '200 VESTS',
      totalVestingFundSteem: '75 HIVE',
    });
    expect(hiveClient.getDynamicGlobalProperties).not.toHaveBeenCalled();
  });

  it('fetches from Hive on cache miss and writes Redis with TTL', async () => {
    const fields = await cache.getChainContextFields();

    expect(fields).toEqual({
      totalVestingShares: '100 VESTS',
      totalVestingFundSteem: '50 HIVE',
    });
    expect(hiveClient.getDynamicGlobalProperties).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('dynamic-global-properties'),
      JSON.stringify({
        totalVestingShares: '100 VESTS',
        totalVestingFundSteem: '50 HIVE',
      }),
      HIVE_GLOBAL_PROPERTIES_CACHE_TTL_SEC,
    );
  });

  it('falls back to steem fund field when hive field is absent', async () => {
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100 VESTS',
      total_vesting_fund_steem: '40 STEEM',
    });

    const fields = await cache.getChainContextFields();

    expect(fields.totalVestingFundSteem).toBe('40 STEEM');
  });

  it('returns defaults when Hive returns undefined', async () => {
    hiveClient.getDynamicGlobalProperties.mockResolvedValue(undefined);

    const fields = await cache.getChainContextFields();

    expect(fields).toEqual({
      totalVestingShares: '0',
      totalVestingFundSteem: '0',
    });
  });

  it('fetches from Hive when cached JSON is corrupt', async () => {
    redisGet.mockResolvedValueOnce('not-json');

    const fields = await cache.getChainContextFields();

    expect(fields.totalVestingShares).toBe('100 VESTS');
    expect(hiveClient.getDynamicGlobalProperties).toHaveBeenCalledTimes(1);
  });
});
