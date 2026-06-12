import { WaivPostRewardService } from './waiv-post-reward.service';

describe('WaivPostRewardService', () => {
  const author = 'alice';
  const permlink = 'post-1';
  const blockTs = 1_700_000_000;

  function buildService(overrides: {
    findRootPost?: jest.Mock;
    enqueue?: jest.Mock;
    markDirty?: jest.Mock;
    claimOnce?: jest.Mock;
    incrementWaivRewards?: jest.Mock;
  } = {}) {
    const findRootPost =
      overrides.findRootPost ??
      jest.fn().mockResolvedValue(undefined);
    const enqueue = overrides.enqueue ?? jest.fn().mockResolvedValue(undefined);
    const markDirty = overrides.markDirty ?? jest.fn().mockResolvedValue(undefined);
    const claimOnce = overrides.claimOnce ?? jest.fn().mockResolvedValue(true);
    const incrementWaivRewards =
      overrides.incrementWaivRewards ?? jest.fn().mockResolvedValue(true);

    const service = new WaivPostRewardService(
      { transaction: () => ({ execute: jest.fn() }) } as never,
      {
        findRootPostByAuthorPermlink: findRootPost,
        findRootPostForUpdate: jest.fn(),
        findActiveVotes: jest.fn(),
        applyWaivVoteUpdate: jest.fn(),
        incrementWaivRewards,
      } as never,
      { enqueue } as never,
      { getRewardRate: jest.fn() } as never,
      { markDirty } as never,
      { claimOnce } as never,
    );

    return {
      service,
      findRootPost,
      enqueue,
      markDirty,
      claimOnce,
      incrementWaivRewards,
    };
  }

  it('marks dirty and enqueues sync when post row is missing on vote', async () => {
    const { service, enqueue, markDirty } = buildService();

    await service.handleVotes(
      [
        {
          author,
          permlink,
          voter: 'bob',
          weight: 10000,
          rshares: 1,
          symbol: 'WAIV',
        },
      ],
      blockTs,
    );

    expect(enqueue).toHaveBeenCalledWith(author, permlink, blockTs, true);
    expect(markDirty).toHaveBeenCalledWith(author, permlink, blockTs);
  });

  it('skips increment when reward dedup claims duplicate', async () => {
    const findRootPost = jest.fn().mockResolvedValue({
      author,
      permlink,
      json_metadata: '{}',
    });
    const { service, claimOnce, incrementWaivRewards } = buildService({
      findRootPost,
      claimOnce: jest.fn().mockResolvedValue(false),
    });

    await service.handleRewards([
      {
        heTransactionId: 'tx-99',
        authorperm: `@${author}/${permlink}`,
        quantity: 2,
        symbol: 'WAIV',
        event: 'authorReward',
      },
    ]);

    expect(claimOnce).toHaveBeenCalledWith(
      'tx-99',
      'authorReward',
      `@${author}/${permlink}`,
    );
    expect(incrementWaivRewards).not.toHaveBeenCalled();
  });

  it('skips increment when post rewards are finalized', async () => {
    const findRootPost = jest.fn().mockResolvedValue({
      author,
      permlink,
      json_metadata: '{}',
      rewards_finalized_at: '2026-01-01T00:00:00.000Z',
    });
    const { service, incrementWaivRewards } = buildService({ findRootPost });

    await service.handleRewards([
      {
        heTransactionId: 'tx-1',
        authorperm: `@${author}/${permlink}`,
        quantity: 2,
        symbol: 'WAIV',
        event: 'authorReward',
      },
    ]);

    expect(incrementWaivRewards).not.toHaveBeenCalled();
  });
});
