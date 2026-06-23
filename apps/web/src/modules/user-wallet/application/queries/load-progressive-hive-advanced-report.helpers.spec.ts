import { accountsForNextAdvancedReportRequest } from './load-progressive-hive-advanced-report.helpers';

describe('load-progressive-hive-advanced-report helpers', () => {
  it('requests only accounts that still have more rows', () => {
    const next = accountsForNextAdvancedReportRequest([
      { name: 'flowmaster', cursor: 450, hasMore: true },
      { name: 'grampo', cursor: null, hasMore: false },
    ]);

    expect(next).toEqual([{ name: 'flowmaster', cursor: 450 }]);
  });

  it('returns an empty list when every account is exhausted', () => {
    expect(
      accountsForNextAdvancedReportRequest([
        { name: 'flowmaster', cursor: null, hasMore: false },
        { name: 'grampo', cursor: null, hasMore: false },
      ]),
    ).toEqual([]);
  });
});
