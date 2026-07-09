import { calculateAccountVoteValues } from './calculate-account-vote-values';
import { calculateEngineManaPercent } from './calculate-engine-mana';
import { formatHiveReputation } from './format-hive-reputation';
import { calculateHiveUpvotingManaPercent } from './calculate-hive-voting-mana';

describe('formatHiveReputation', () => {
  it('returns 25 for zero reputation', () => {
    expect(formatHiveReputation(0)).toBe(25);
  });

  it('formats positive chain reputation', () => {
    expect(formatHiveReputation(1_234_567_890)).toBeGreaterThan(25);
  });
});

describe('calculateEngineManaPercent', () => {
  it('regenerates mana toward 100%', () => {
    const now = Date.now();
    const result = calculateEngineManaPercent(
      {
        _id: { rewardPoolId: 13, account: 'alice' },
        rewardPoolId: 13,
        account: 'alice',
        votingPower: 5000,
        downvotingPower: 5000,
        lastVoteTimestamp: now - 2 * 24 * 3600 * 1000,
      },
      now,
    );
    expect(result.upvotingManaPercent).toBeGreaterThan(50);
    expect(result.upvotingManaPercent).toBeLessThanOrEqual(100);
  });
});

describe('calculateAccountVoteValues', () => {
  it('returns zero when inputs are empty', () => {
    const result = calculateAccountVoteValues({
      account: {},
      rewardBalance: 0,
      recentClaims: 0,
      hiveUsd: 0,
      waivStake: 0,
      waivDelegationsIn: 0,
      engineVotingPowerPercent: 0,
      waivRewardRate: 0,
      waivQuotePriceHive: 0,
      hiveUsdForWaiv: 0,
    });
    expect(result.totalVoteValueUsd).toBe(0);
  });

  it('computes positive hive vote value for vested account', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const result = calculateAccountVoteValues(
      {
        account: {
          vesting_shares: '10000.000000 VESTS',
          received_vesting_shares: '0.000000 VESTS',
          delegated_vesting_shares: '0.000000 VESTS',
          voting_power: 10000,
          last_vote_time: '2025-12-31T00:00:00',
        },
        rewardBalance: 1000,
        recentClaims: 100,
        hiveUsd: 0.25,
        waivStake: 0,
        waivDelegationsIn: 0,
        engineVotingPowerPercent: 0,
        waivRewardRate: 0,
        waivQuotePriceHive: 0,
        hiveUsdForWaiv: 0,
      },
      now,
    );
    expect(result.estimatedHiveUsd).toBeGreaterThan(0);
    expect(result.totalVoteValueUsd).toBe(result.estimatedHiveUsd);
  });
});

describe('calculateHiveUpvotingManaPercent', () => {
  it('returns full mana when last vote is recent and voting_power is max', () => {
    const percent = calculateHiveUpvotingManaPercent(
      { voting_power: 10000, last_vote_time: '2026-01-01T00:00:00' },
      Date.parse('2026-01-01T00:00:00Z'),
    );
    expect(percent).toBe(100);
  });
});
