import type { RedisClientFactory } from '@opden-data-layer/clients';
import type { CurrencyQueryService } from '@opden-data-layer/currency';

import {
  POST_REWARD_FIAT_RATES_CACHE_TTL_SEC,
  POST_REWARD_WAIV_HIVE_RATE_CACHE_TTL_SEC,
} from '../../constants/cache.constants';
import { PostRewardRatesCache } from './post-reward-rates.cache';

describe('PostRewardRatesCache', () => {
  const currencyQuery: jest.Mocked<
    Pick<CurrencyQueryService, 'engineCurrent' | 'legacyRateLatest'>
  > = {
    engineCurrent: jest.fn().mockResolvedValue({ USD: 0.12, HIVE: 1.5 }),
    legacyRateLatest: jest.fn().mockResolvedValue({ USD: 1, EUR: 0.92 }),
  };

  let redisGet: jest.Mock;
  let redisSet: jest.Mock;
  let cache: PostRewardRatesCache;

  beforeEach(() => {
    redisGet = jest.fn().mockResolvedValue(null);
    redisSet = jest.fn().mockResolvedValue(undefined);
    const redisFactory = {
      getClient: () => ({ get: redisGet, set: redisSet }),
    } as unknown as RedisClientFactory;
    cache = new PostRewardRatesCache(
      currencyQuery as unknown as CurrencyQueryService,
      redisFactory,
    );
    jest.clearAllMocks();
    currencyQuery.engineCurrent.mockResolvedValue({ USD: 0.12, HIVE: 1.5 });
    currencyQuery.legacyRateLatest.mockResolvedValue({ USD: 1, EUR: 0.92 });
    redisGet.mockResolvedValue(null);
  });

  it('fetches live rates on cache miss and writes Redis with TTL', async () => {
    const snapshot = await cache.getSnapshot();

    expect(snapshot).toEqual({ waivUsdRate: 0.12, fiatRates: { USD: 1, EUR: 0.92 } });
    expect(currencyQuery.engineCurrent).toHaveBeenCalledTimes(1);
    expect(currencyQuery.legacyRateLatest).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledTimes(2);
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('post-reward'),
      JSON.stringify(0.12),
      POST_REWARD_WAIV_HIVE_RATE_CACHE_TTL_SEC,
    );
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('fiat'),
      JSON.stringify({ USD: 1, EUR: 0.92 }),
      POST_REWARD_FIAT_RATES_CACHE_TTL_SEC,
    );
  });

  it('returns cached values without calling currency services', async () => {
    redisGet
      .mockResolvedValueOnce(JSON.stringify(0.25))
      .mockResolvedValueOnce(JSON.stringify({ USD: 1, GBP: 0.8 }));

    const snapshot = await cache.getSnapshot();

    expect(snapshot).toEqual({ waivUsdRate: 0.25, fiatRates: { USD: 1, GBP: 0.8 } });
    expect(currencyQuery.engineCurrent).not.toHaveBeenCalled();
    expect(currencyQuery.legacyRateLatest).not.toHaveBeenCalled();
  });

  it('refetches when cached waiv rate is corrupt', async () => {
    redisGet.mockResolvedValueOnce('not-json').mockResolvedValueOnce(null);

    const snapshot = await cache.getSnapshot();

    expect(snapshot.waivUsdRate).toBe(0.12);
    expect(currencyQuery.engineCurrent).toHaveBeenCalledTimes(1);
  });
});
