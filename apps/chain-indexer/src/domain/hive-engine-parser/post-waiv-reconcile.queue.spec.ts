import { PostWaivReconcileQueue } from './post-waiv-reconcile.queue';
import type { RedisClientFactory } from '@opden-data-layer/clients';

describe('PostWaivReconcileQueue', () => {
  it('claimOldest reads full ZSET from -inf', async () => {
    const zRangeByScore = jest.fn().mockResolvedValue(['alice:post-1']);
    const factory = {
      getClient: () => ({ zRangeByScore, zAdd: jest.fn(), zRem: jest.fn() }),
    } as unknown as RedisClientFactory;

    const queue = new PostWaivReconcileQueue(factory);
    const rows = await queue.claimOldest(10);

    expect(zRangeByScore).toHaveBeenCalledWith(
      expect.any(String),
      '-inf',
      '+inf',
      0,
      10,
    );
    expect(rows).toEqual([{ author: 'alice', permlink: 'post-1' }]);
  });

  it('touchDirty bumps score via zadd with current unix time', async () => {
    const zAdd = jest.fn().mockResolvedValue(undefined);
    const factory = {
      getClient: () => ({ zAdd, zRangeByScore: jest.fn(), zRem: jest.fn() }),
    } as unknown as RedisClientFactory;

    const queue = new PostWaivReconcileQueue(factory);
    const before = Math.floor(Date.now() / 1000);
    await queue.touchDirty('bob', 'p2');
    const after = Math.floor(Date.now() / 1000);

    expect(zAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number),
      'bob:p2',
    );
    const score = zAdd.mock.calls[0][1] as number;
    expect(score).toBeGreaterThanOrEqual(before);
    expect(score).toBeLessThanOrEqual(after);
  });
});
