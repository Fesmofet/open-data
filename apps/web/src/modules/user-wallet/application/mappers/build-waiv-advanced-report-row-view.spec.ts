import { buildWaivAdvancedReportRowView } from './build-waiv-advanced-report-row-view';
import type { WaivAdvancedReportRowApi } from '../dto/waiv-advanced-report-api.schema';

describe('buildWaivAdvancedReportRowView', () => {
  const baseRow: WaivAdvancedReportRowApi = {
    userName: 'alice',
    operationIndex: 42,
    timestamp: 1_704_067_200,
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '1000',
    memo: 'test',
    waivAmount: '1000',
    wpAmount: '',
    withdrawDeposit: 'd',
    checked: false,
    waivUsd: 0.05,
    waivRateFiat: 0.05,
    waivFiat: 50,
    wpFiat: 0,
    totalFiat: 50,
    payload: {},
  };

  it('maps WAIV transfer description', () => {
    const view = buildWaivAdvancedReportRowView(baseRow);
    expect(view.description).toBe('Received from @bob');
    expect(view.waivAmount).toBe('1000');
    expect(view.wpAmount).toBe('');
  });

  it('maps stake to WP column via API fields', () => {
    const view = buildWaivAdvancedReportRowView({
      ...baseRow,
      type: 'tokens_stake',
      waivAmount: '',
      wpAmount: '500',
      withdrawDeposit: 'w',
    });
    expect(view.wpAmount).toBe('500');
    expect(view.description).toContain('Power up');
  });
});
