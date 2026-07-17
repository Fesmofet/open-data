import { calculatePostExpertiseDeltas } from '@opden-data-layer/core';
import { PostExpertiseService } from './post-expertise.service';

describe('PostExpertiseService', () => {
  const post: {
    author: string;
    permlink: string;
    pending_payout_value: string;
    total_payout_value: string;
    curator_payout_value: string;
    max_accepted_payout: string;
    total_payout_waiv: number;
    total_rewards_waiv: number;
    created_unix: number;
    last_payout: string;
    rewards_finalized_at: string;
    expertise_applied_at: string | null;
  } = {
    author: 'alice',
    permlink: 'post-1',
    pending_payout_value: '0.000 HBD',
    total_payout_value: '2.000 HBD',
    curator_payout_value: '0.000 HBD',
    max_accepted_payout: '1000000.000 HBD',
    total_payout_waiv: 0,
    total_rewards_waiv: 0,
    created_unix: 1_700_000_000,
    last_payout: '2024-01-01T00:00:00',
    rewards_finalized_at: '2024-01-02T00:00:00.000Z',
    expertise_applied_at: null,
  };

  function makeService(
    overrides: Partial<{
      postRow: typeof post | null;
      objectRows: Array<{ object_id: string; percent: number | null }>;
      waivRate: number;
      claimReturns: boolean;
    }> = {},
  ): PostExpertiseService {
    const claimExpertiseApplied = jest.fn().mockResolvedValue(
      overrides.claimReturns === false ? undefined : post,
    );
    const applyExpertiseIncrements = jest.fn().mockResolvedValue(undefined);
    const execute = jest.fn(async (cb: (trx: object) => Promise<boolean>) =>
      cb({}),
    );
    const transaction = jest.fn(() => ({ execute }));

    const service = Object.create(PostExpertiseService.prototype) as PostExpertiseService;
    Object.assign(service, {
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
      postsRepository: {
        findRootPostByAuthorPermlink: jest
          .fn()
          .mockResolvedValue(
            overrides.postRow === null ? undefined : (overrides.postRow ?? post),
          ),
      },
      postObjectsRepository: {
        findSharesByPost: jest
          .fn()
          .mockResolvedValue(overrides.objectRows ?? [{ object_id: 'neoxian', percent: 100 }]),
      },
      hiveEngineRatesRepository: {
        resolveWaivUsdRateAtDate: jest.fn().mockResolvedValue(overrides.waivRate ?? 0),
      },
      postExpertiseRepository: {
        claimExpertiseApplied,
        applyExpertiseIncrements,
      },
      db: { transaction },
    });
    return service;
  }

  it('skips when expertise already applied', async () => {
    const service = makeService({
      postRow: { ...post, expertise_applied_at: '2024-01-03T00:00:00.000Z' },
    });

    const ok = await service.applyForPost('alice', 'post-1');
    expect(ok).toBe(false);
  });

  it('claims and applies deltas in a transaction', async () => {
    const service = makeService();
    const ok = await service.applyForPost('alice', 'post-1');

    expect(ok).toBe(true);
    const repo = (service as unknown as {
      postExpertiseRepository: {
        claimExpertiseApplied: jest.Mock;
        applyExpertiseIncrements: jest.Mock;
      };
    }).postExpertiseRepository;
    expect(repo.claimExpertiseApplied).toHaveBeenCalled();
    expect(repo.applyExpertiseIncrements).toHaveBeenCalledWith(
      'alice',
      calculatePostExpertiseDeltas(
        {
          pendingPayoutValue: post.pending_payout_value,
          totalPayoutValue: post.total_payout_value,
          curatorPayoutValue: post.curator_payout_value,
          maxAcceptedPayout: post.max_accepted_payout,
          totalPayoutWaiv: 0,
          totalRewardsWaiv: 0,
          createdUnix: post.created_unix,
        },
        0,
        [{ objectId: 'neoxian', percent: 100 }],
      ),
      expect.anything(),
    );
  });

  it('marks post without objects as applied without increments', async () => {
    const service = makeService({ objectRows: [] });
    const ok = await service.applyForPost('alice', 'post-1');

    expect(ok).toBe(true);
    const repo = (service as unknown as {
      postExpertiseRepository: { applyExpertiseIncrements: jest.Mock };
    }).postExpertiseRepository;
    expect(repo.applyExpertiseIncrements).not.toHaveBeenCalled();
  });
});
