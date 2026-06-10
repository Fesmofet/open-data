import { PostRewardService } from './post-reward.service';
import type { PostRewardInput } from './post-reward.types';
import type { PostRewardRatesCache } from './post-reward-rates.cache';

const baseInput: PostRewardInput = {
  pendingPayoutValue: '1.000 HBD',
  totalPayoutValue: '0.500 HBD',
  curatorPayoutValue: '0.200 HBD',
  maxAcceptedPayout: '1000000.000 HBD',
  cashoutTime: '2099-01-01T00:00:00',
  percentHbd: 10000,
  promoted: null,
  totalPayoutWaiv: 10,
  totalRewardsWaiv: 0,
  beneficiaries: [{ account: 'alice', weight: 9700 }],
  jsonMetadata: '{"tags":["waivio"]}',
};

const snapshot = {
  waivUsdRate: 0.1,
  fiatRates: { USD: 1, EUR: 0.92 },
};

describe('PostRewardService', () => {
  const getSnapshot = jest.fn().mockResolvedValue(snapshot);
  const ratesCache = { getSnapshot } as unknown as PostRewardRatesCache;
  const service = new PostRewardService(ratesCache);

  beforeEach(() => {
    getSnapshot.mockClear();
    getSnapshot.mockResolvedValue(snapshot);
  });

  it('builds reward with beneficiary payout labels for modal', async () => {
    const reward = await service.buildReward(baseInput, 'USD');
    expect(reward?.phase).toBe('potential');
    expect(reward?.beneficiaries?.[0]?.payout?.label).toMatch(/\$/);
    expect(getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('converts badge label to requested currency', async () => {
    const reward = await service.buildReward(baseInput, 'EUR');
    expect(reward?.currency).toBe('EUR');
    expect(reward?.label).toContain('€');
  });

  it('enriches feed items in batch with waivRewardEligible', async () => {
    const items = [{ id: '1' }, { id: '2' }];
    const enriched = await service.enrichFeedItems(
      items,
      [baseInput, baseInput],
      'USD',
    );
    expect(enriched[0].reward?.label).toMatch(/\$/);
    expect(enriched[0].waivRewardEligible).toBe(true);
    expect(getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('defaults invalid currency to USD', async () => {
    const currency = await service.resolveCurrency('INVALID');
    expect(currency).toBe('USD');
  });
});
