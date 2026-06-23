import { HIVE_OP } from '@opden-data-layer/core/hive-account-history';

import { splitAdvancedReportDisplayAmounts } from './split-advanced-report-display-amounts';
import type { AdvancedReportDisplayRow } from './split-advanced-report-display-amounts';

const chainContext = {
  totalVestingShares: '341602453178.281332 VESTS',
  totalVestingFundSteem: '210616861.512 HIVE',
};

function row(
  overrides: Partial<AdvancedReportDisplayRow>,
): AdvancedReportDisplayRow {
  return {
    type: HIVE_OP.TRANSFER,
    amount: '',
    from: '',
    to: '',
    payload: {},
    withdrawDeposit: '',
    ...overrides,
  };
}

describe('splitAdvancedReportDisplayAmounts', () => {
  it('converts claim reward vests to HP', () => {
    const amounts = splitAdvancedReportDisplayAmounts(
      row({
        type: HIVE_OP.CLAIM_REWARD_BALANCE,
        withdrawDeposit: 'd',
        payload: {
          reward_hive: '0.000 HIVE',
          reward_hbd: '0.012 HBD',
          reward_vests: '4.933654 VESTS',
        },
      }),
      chainContext,
    );

    expect(amounts.hbdAmount).toBe('0.012');
    expect(amounts.hiveAmount).toBe('');
    expect(Number(amounts.hpAmount)).toBeCloseTo(0.003, 3);
  });

  it('converts claim reward vests from asset object payload', () => {
    const amounts = splitAdvancedReportDisplayAmounts(
      row({
        type: HIVE_OP.CLAIM_REWARD_BALANCE,
        payload: {
          reward_hive: '0.000 HIVE',
          reward_hbd: '0.000 HBD',
          reward_vests: { amount: '4933654', precision: 6 },
        },
      }),
      chainContext,
    );

    expect(Number(amounts.hpAmount)).toBeCloseTo(0.003, 3);
  });

  it('shows power down deposited amount in HP column', () => {
    const amounts = splitAdvancedReportDisplayAmounts(
      row({
        type: HIVE_OP.FILL_VESTING_WITHDRAW,
        amount: '0.618772 HIVE',
        from: 'flowmaster',
        to: 'flowmaster',
        withdrawDeposit: '',
      }),
      chainContext,
    );

    expect(amounts.hpAmount).toBe('0.618772');
    expect(amounts.hiveAmount).toBe('');
  });
});
