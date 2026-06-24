import { HIVE_OP } from '@opden-data-layer/core/hive-account-history';

import { buildAdvancedReportRowView } from './build-advanced-report-row-view';

describe('buildAdvancedReportRowView', () => {
  it('maps transfer row with fiat from API only', () => {
    const view = buildAdvancedReportRowView({
      userName: 'alice',
      operationIndex: 7,
      timestamp: 1_700_000_000,
      type: HIVE_OP.TRANSFER,
      from: 'bob',
      to: 'alice',
      amount: '3.000 HIVE',
      memo: 'test',
      hiveAmount: '3.000',
      hbdAmount: '',
      hpAmount: '',
      withdrawDeposit: 'd',
      checked: false,
      hiveUsd: 0.2,
      hbdUsd: 1,
      hiveRateFiat: 0.2,
      hbdRateFiat: 1,
      hiveFiat: 0.6,
      hbdFiat: 0,
      hpFiat: 0,
      totalFiat: 0.6,
      payload: {},
    });

    expect(view.hiveAmount).toBe('3.000');
    expect(view.hiveRateFiat).toBe(0.2);
    expect(view.hbdRateFiat).toBe(1);
    expect(view.totalFiat).toBe(0.6);
    expect(view.description).toBe('Received from @bob');
    expect(view.descriptionView).toEqual({
      kind: 'withAccount',
      label: 'Received from',
      account: 'bob',
    });
  });
});
