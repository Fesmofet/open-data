import { calculatePostRewardUsd } from './calculate-post-reward-usd';

const baseInput = {
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

describe('calculatePostRewardUsd', () => {
  it('computes potential payout with WAIV USD component', () => {
    const result = calculatePostRewardUsd(baseInput, 0.1);
    expect(result?.phase).toBe('potential');
    expect(result?.waivUsd).toBe(1);
    expect(result?.potentialUsd).toBe(2);
  });

  it('uses paid phase after cashout', () => {
    const result = calculatePostRewardUsd(
      {
        ...baseInput,
        cashoutTime: '2020-01-01T00:00:00',
        pendingPayoutValue: '0.000 HBD',
      },
      0.1,
    );
    expect(result?.phase).toBe('paid');
    expect(result?.authorUsd).toBeGreaterThan(0);
  });

  it('returns null when total is zero and payout not declined', () => {
    const result = calculatePostRewardUsd(
      {
        ...baseInput,
        pendingPayoutValue: '0.000 HBD',
        totalPayoutValue: '0.000 HBD',
        curatorPayoutValue: '0.000 HBD',
        totalPayoutWaiv: 0,
      },
      0.1,
    );
    expect(result).toBeNull();
  });
});
