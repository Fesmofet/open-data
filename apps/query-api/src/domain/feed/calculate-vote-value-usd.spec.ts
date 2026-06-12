import {
  calculateVoteValueUsd,
  isDownvote,
  isUpvote,
  type VoteValuePostContext,
} from './calculate-vote-value-usd';

const basePost: VoteValuePostContext = {
  pendingPayoutValue: '10.000 HBD',
  totalPayoutValue: '0.000 HBD',
  curatorPayoutValue: '0.000 HBD',
  cashoutTime: '2099-01-01T00:00:00',
  totalPayoutWaiv: 0,
  totalRewardsWaiv: 0,
  netRsharesWaiv: 0,
  totalHiveRsharesSum: 100,
  totalWaivRsharesSum: 0,
};

describe('calculateVoteValueUsd', () => {
  it('splits payout proportionally by rshares', () => {
    const value = calculateVoteValueUsd(
      basePost,
      { rshares: 25, rsharesWaiv: 0 },
      0,
    );
    expect(value).toBeCloseTo(2.5);
  });

  it('adds WAIV component when net_rshares_waiv is set', () => {
    const post: VoteValuePostContext = {
      ...basePost,
      totalPayoutWaiv: 100,
      netRsharesWaiv: 50,
      totalHiveRsharesSum: 0,
      totalWaivRsharesSum: 0,
    };
    const value = calculateVoteValueUsd(
      post,
      { rshares: 0, rsharesWaiv: 10 },
      2,
    );
    expect(value).toBeCloseTo(40);
  });

  it('uses sum of vote rshares_waiv when post net_rshares_waiv is zero', () => {
    const post: VoteValuePostContext = {
      ...basePost,
      cashoutTime: '2020-01-01T00:00:00',
      totalRewardsWaiv: 50,
      netRsharesWaiv: 0,
      totalHiveRsharesSum: 0,
      totalWaivRsharesSum: 100,
    };
    const value = calculateVoteValueUsd(
      post,
      { rshares: 0, rsharesWaiv: 25 },
      2,
    );
    expect(value).toBeCloseTo(25);
  });

  it('falls back to total_payout_waiv when cashed out but total_rewards_waiv is zero', () => {
    const post: VoteValuePostContext = {
      ...basePost,
      cashoutTime: '2020-01-01T00:00:00',
      totalPayoutWaiv: 80,
      totalRewardsWaiv: 0,
      netRsharesWaiv: 100,
      totalHiveRsharesSum: 0,
      totalWaivRsharesSum: 0,
    };
    const value = calculateVoteValueUsd(
      post,
      { rshares: 0, rsharesWaiv: 10 },
      0.01,
    );
    expect(value).toBeCloseTo(0.08);
  });
});

describe('vote direction helpers', () => {
  it('classifies upvotes', () => {
    expect(isUpvote(100, 0)).toBe(true);
    expect(isUpvote(0, 5)).toBe(true);
    expect(isUpvote(-50, 0)).toBe(false);
  });

  it('classifies downvotes', () => {
    expect(isDownvote(-1)).toBe(true);
    expect(isDownvote(0)).toBe(false);
  });
});
