import { parseClaimRewardNotificationPayload } from './parse-claim-reward-notification-payload';

const chainContext = {
  totalVestingShares: '341602453178.281332 VESTS',
  totalVestingFundSteem: '210616861.512 HIVE',
};

describe('parseClaimRewardNotificationPayload', () => {
  it('parses claim_reward_balance op fields and converts vests to HP', () => {
    const result = parseClaimRewardNotificationPayload(
      {
        account: 'new-way',
        reward_hive: '0.000 HIVE',
        reward_hbd: '0.159 HBD',
        reward_vests: '1555.967654 VESTS',
      },
      chainContext,
    );

    expect(result.rewardHive).toBe('0.000 HIVE');
    expect(result.rewardHbd).toBe('0.159 HBD');
    expect(result.rewardHp).toBe('0.959 HP');
  });

  it('ignores account-state *_balance fields when op fields are absent', () => {
    const result = parseClaimRewardNotificationPayload(
      {
        reward_hive_balance: '1.000 HIVE',
        reward_hbd_balance: '2.000 HBD',
        reward_vesting_balance: '3.000000 VESTS',
      },
      chainContext,
    );

    expect(result).toEqual({
      rewardHive: '0.000 HIVE',
      rewardHbd: '0.000 HBD',
      rewardHp: '0.000 HP',
    });
  });

  it('parses vests from asset object payload', () => {
    const result = parseClaimRewardNotificationPayload(
      {
        reward_hive: '0.000 HIVE',
        reward_hbd: '0.012 HBD',
        reward_vests: { amount: '4933654', precision: 6 },
      },
      chainContext,
    );

    expect(result.rewardHive).toBe('0.000 HIVE');
    expect(result.rewardHbd).toBe('0.012 HBD');
    expect(result.rewardHp).toBe('0.003 HP');
  });

  it('returns zero HP when vests are missing', () => {
    const result = parseClaimRewardNotificationPayload(
      {
        reward_hive: '1.234 HIVE',
        reward_hbd: '0.000 HBD',
      },
      chainContext,
    );

    expect(result.rewardHive).toBe('1.234 HIVE');
    expect(result.rewardHbd).toBe('0.000 HBD');
    expect(result.rewardHp).toBe('0.000 HP');
  });
});
