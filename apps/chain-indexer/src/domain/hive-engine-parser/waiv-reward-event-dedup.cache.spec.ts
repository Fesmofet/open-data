import { WaivRewardEventDedupCache } from './waiv-reward-event-dedup.cache';
import type { RedisClientFactory } from '@opden-data-layer/clients';

describe('WaivRewardEventDedupCache', () => {
  it('returns true when SET NX succeeds', async () => {
    const trySetNx = jest.fn().mockResolvedValue(true);
    const factory = {
      getClient: () => ({ trySetNx }),
    } as unknown as RedisClientFactory;

    const cache = new WaivRewardEventDedupCache(factory);
    const ok = await cache.claimOnce('tx-1', 'authorReward', '@alice/p');

    expect(ok).toBe(true);
    expect(trySetNx).toHaveBeenCalled();
  });

  it('returns false when key already exists', async () => {
    const trySetNx = jest.fn().mockResolvedValue(false);
    const factory = {
      getClient: () => ({ trySetNx }),
    } as unknown as RedisClientFactory;

    const cache = new WaivRewardEventDedupCache(factory);
    const ok = await cache.claimOnce('tx-1', 'authorReward', '@alice/p');

    expect(ok).toBe(false);
  });

  it('fails open on Redis error', async () => {
    const trySetNx = jest.fn().mockRejectedValue(new Error('redis down'));
    const factory = {
      getClient: () => ({ trySetNx }),
    } as unknown as RedisClientFactory;

    const cache = new WaivRewardEventDedupCache(factory);
    const ok = await cache.claimOnce('tx-1', 'authorReward', '@alice/p');

    expect(ok).toBe(true);
  });
});
