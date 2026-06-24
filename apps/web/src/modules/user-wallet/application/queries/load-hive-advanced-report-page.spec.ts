import { loadHiveAdvancedReportPage } from './load-hive-advanced-report-page';
import type { HiveAdvancedReportRequest } from '../dto/hive-advanced-report-api.schema';

jest.mock('../../infrastructure/clients/hive-advanced-report.browser.client', () => ({
  fetchHiveAdvancedReportClient: jest.fn(),
}));

import { fetchHiveAdvancedReportClient } from '../../infrastructure/clients/hive-advanced-report.browser.client';

const fetchMock = fetchHiveAdvancedReportClient as jest.MockedFunction<
  typeof fetchHiveAdvancedReportClient
>;

const browseBody: HiveAdvancedReportRequest = {
  accounts: [{ name: 'alice' }],
  filterAccounts: ['alice'],
  limit: 50,
  currency: 'USD',
};

function pageResult(
  wallet: Array<{ userName: string; operationIndex: number; timestamp: number }>,
  accounts: Array<{ name: string; cursor: number | null; hasMore: boolean }>,
  hasMore: boolean,
) {
  return {
    report: {
      wallet: wallet.map((row) => ({
        ...row,
        type: 'transfer',
        from: 'bob',
        to: 'alice',
        amount: '1.000 HIVE',
        memo: '',
        hiveAmount: '1.000',
        hbdAmount: '',
        hpAmount: '',
        withdrawDeposit: 'd' as const,
        checked: false,
        hiveUsd: 1,
        hbdUsd: 1,
        hiveRateFiat: 1,
        hbdRateFiat: 1,
        hiveFiat: 1,
        hbdFiat: 0,
        hpFiat: 0,
        totalFiat: 1,
        payload: {},
      })),
      accounts,
      hasMore,
      deposits: wallet.length,
      withdrawals: 0,
    },
    error: null,
  };
}

describe('loadHiveAdvancedReportPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns first browse page', async () => {
    fetchMock.mockResolvedValueOnce(
      pageResult(
        [{ userName: 'alice', operationIndex: 2, timestamp: 2 }],
        [{ name: 'alice', cursor: 1, hasMore: true }],
        true,
      ),
    );

    const result = await loadHiveAdvancedReportPage(browseBody);

    expect(result.error).toBeNull();
    expect(result.report?.wallet).toHaveLength(1);
    expect(result.report?.hasMore).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('appends into existing wallet on show more', async () => {
    const existing = pageResult(
      [{ userName: 'alice', operationIndex: 2, timestamp: 2 }],
      [{ name: 'alice', cursor: 1, hasMore: true }],
      true,
    ).report!.wallet;

    fetchMock.mockResolvedValueOnce(
      pageResult(
        [{ userName: 'alice', operationIndex: 1, timestamp: 1 }],
        [],
        false,
      ),
    );

    const result = await loadHiveAdvancedReportPage(
      { ...browseBody, accounts: [{ name: 'alice', cursor: 1 }] },
      existing,
    );

    expect(result.report?.wallet).toHaveLength(2);
    expect(result.report?.wallet[0]?.operationIndex).toBe(2);
    expect(result.report?.hasMore).toBe(false);
  });
});
