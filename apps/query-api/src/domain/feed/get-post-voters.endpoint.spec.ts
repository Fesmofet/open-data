import type { Post } from '@opden-data-layer/core';

import { GetPostVotersEndpoint } from './get-post-voters.endpoint';

function makePost(): Post {
  return {
    author: 'alice',
    permlink: 'post-1',
    pending_payout_value: '10.000 HBD',
    total_payout_value: '0.000 HBD',
    curator_payout_value: '0.000 HBD',
    cashout_time: '2099-01-01T00:00:00',
    total_payout_waiv: 0,
    total_rewards_waiv: 0,
    net_rshares_waiv: 0,
  } as Post;
}

describe('GetPostVotersEndpoint', () => {
  const postsRepo = {
    findPostVoterCounts: jest.fn(),
    findPostVotersByDirection: jest.fn(),
    findPostsByKeys: jest.fn(),
  };
  const threadsRepo = {
    findThreadByKey: jest.fn(),
    findThreadVoterCounts: jest.fn(),
    findThreadVotersByDirection: jest.fn(),
  };
  const accounts = {
    findByNames: jest.fn(),
  };
  const hiveClient = {
    getActiveVotes: jest.fn(),
    getContent: jest.fn(),
  };
  const ratesCache = {
    getSnapshot: jest.fn().mockResolvedValue({
      waivUsdRate: 0,
      fiatRates: { USD: 1 },
    }),
  };

  let endpoint: GetPostVotersEndpoint;

  beforeEach(() => {
    jest.clearAllMocks();
    endpoint = new GetPostVotersEndpoint(
      postsRepo as never,
      threadsRepo as never,
      accounts as never,
      hiveClient as never,
      ratesCache as never,
    );
    accounts.findByNames.mockResolvedValue([]);
  });

  it('returns mapped voters from DB with counts', async () => {
    postsRepo.findPostVoterCounts.mockResolvedValue({
      upvoteCount: 2,
      downvoteCount: 0,
      totalHiveRsharesSum: 100,
      totalWaivRsharesSum: 0,
    });
    postsRepo.findPostsByKeys.mockResolvedValue([makePost()]);
    postsRepo.findPostVotersByDirection.mockResolvedValue([
      {
        voter: 'bob',
        percent: 100,
        weight: 10000,
        rshares: BigInt(50),
        rshares_waiv: 0,
      },
      {
        voter: 'bad-sync',
        percent: 10000,
        weight: 5024706801750,
        rshares: BigInt(99),
        rshares_waiv: 0,
      },
    ]);

    const result = await endpoint.execute(
      'alice',
      'post-1',
      { direction: 'up', contentType: 'post', limit: 20 },
      'USD',
    );

    expect(result?.upvoteCount).toBe(2);
    expect(result?.items).toHaveLength(2);
    expect(result?.items[0]?.voter).toBe('bad-sync');
    expect(result?.items[0]?.valueUsd).toBeCloseTo(9.9);
    expect(result?.items[1]?.voter).toBe('bob');
    expect(result?.items[1]?.valueUsd).toBeCloseTo(5);
  });

  it('sorts WAIV voters above Hive-only voters by fiat value', async () => {
    ratesCache.getSnapshot.mockResolvedValue({
      waivUsdRate: 2,
      fiatRates: { USD: 1 },
    });
    postsRepo.findPostVoterCounts.mockResolvedValue({
      upvoteCount: 2,
      downvoteCount: 0,
      totalHiveRsharesSum: 1000,
      totalWaivRsharesSum: 100,
    });
    postsRepo.findPostsByKeys.mockResolvedValue([
      {
        ...makePost(),
        total_payout_waiv: 100,
        net_rshares_waiv: 100,
      },
    ]);
    postsRepo.findPostVotersByDirection.mockResolvedValue([
      {
        voter: 'gtg',
        percent: 100,
        weight: 10000,
        rshares: BigInt(900),
        rshares_waiv: 0,
      },
      {
        voter: 'waivio.com',
        percent: 100,
        weight: 10000,
        rshares: BigInt(1),
        rshares_waiv: 70,
      },
    ]);

    const result = await endpoint.execute(
      'alice',
      'post-1',
      { direction: 'up', contentType: 'post', limit: 20 },
      'USD',
    );

    expect(result?.items[0]?.voter).toBe('waivio.com');
    expect(result?.items[0]?.valueUsd).toBeCloseTo(140, 0);
    expect(result?.items[1]?.voter).toBe('gtg');
    expect(result?.items[1]?.valueUsd).toBeCloseTo(9);
  });

  it('calculates WAIV vote USD from rshares_waiv sum on paid posts', async () => {
    ratesCache.getSnapshot.mockResolvedValue({
      waivUsdRate: 2,
      fiatRates: { USD: 1 },
    });
    postsRepo.findPostVoterCounts.mockResolvedValue({
      upvoteCount: 1,
      downvoteCount: 0,
      totalHiveRsharesSum: 0,
      totalWaivRsharesSum: 100,
    });
    postsRepo.findPostsByKeys.mockResolvedValue([
      {
        ...makePost(),
        cashout_time: '2020-01-01T00:00:00',
        total_rewards_waiv: 50,
        net_rshares_waiv: 0,
      },
    ]);
    postsRepo.findPostVotersByDirection.mockResolvedValue([
      {
        voter: 'bob',
        percent: 25,
        weight: 2500,
        rshares: BigInt(0),
        rshares_waiv: 25,
      },
    ]);

    const result = await endpoint.execute(
      'alice',
      'post-1',
      { direction: 'up', contentType: 'post', limit: 20 },
      'USD',
    );

    expect(result?.items[0]?.valueUsd).toBeCloseTo(25);
  });

  it('returns null for missing thread', async () => {
    threadsRepo.findThreadByKey.mockResolvedValue(undefined);

    const result = await endpoint.execute(
      'alice',
      'thread-1',
      { direction: 'up', contentType: 'thread', limit: 20 },
      'USD',
    );

    expect(result).toBeNull();
  });
});
