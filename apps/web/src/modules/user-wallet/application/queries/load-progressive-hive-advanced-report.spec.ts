import { loadProgressiveHiveAdvancedReport } from './load-progressive-hive-advanced-report';
import type { HiveAdvancedReportRequest } from '../dto/hive-advanced-report-api.schema';

jest.mock('../../infrastructure/clients/hive-advanced-report.browser.client', () => ({
  fetchHiveAdvancedReportClient: jest.fn(),
}));

import { fetchHiveAdvancedReportClient } from '../../infrastructure/clients/hive-advanced-report.browser.client';

const fetchMock = fetchHiveAdvancedReportClient as jest.MockedFunction<
  typeof fetchHiveAdvancedReportClient
>;

const baseBody: HiveAdvancedReportRequest = {
  accounts: [{ name: 'alice' }],
  filterAccounts: ['alice'],
  startDate: 1_700_000_000,
  endDate: 1_700_086_400,
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

describe('loadProgressiveHiveAdvancedReport', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('stops when hasMore is false', async () => {
    fetchMock.mockResolvedValueOnce(
      pageResult([{ userName: 'alice', operationIndex: 2, timestamp: 2 }], [], false),
    );

    const result = await loadProgressiveHiveAdvancedReport(baseBody);

    expect(result.error).toBeNull();
    expect(result.report?.wallet).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('next request sends only accounts with hasMore true', async () => {
    fetchMock
      .mockResolvedValueOnce(
        pageResult(
          [{ userName: 'alice', operationIndex: 2, timestamp: 2 }],
          [
            { name: 'alice', cursor: 1, hasMore: true },
            { name: 'bob', cursor: null, hasMore: false },
          ],
          true,
        ),
      )
      .mockResolvedValueOnce(
        pageResult([{ userName: 'alice', operationIndex: 1, timestamp: 1 }], [], false),
      );

    await loadProgressiveHiveAdvancedReport({
      ...baseBody,
      accounts: [{ name: 'alice' }, { name: 'bob' }],
      filterAccounts: ['alice', 'bob'],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0].accounts).toEqual([
      { name: 'alice', cursor: 1 },
    ]);
  });

  it('appends pages into wallet', async () => {
    fetchMock
      .mockResolvedValueOnce(
        pageResult(
          [{ userName: 'alice', operationIndex: 2, timestamp: 2 }],
          [{ name: 'alice', cursor: 1, hasMore: true }],
          true,
        ),
      )
      .mockResolvedValueOnce(
        pageResult([{ userName: 'alice', operationIndex: 1, timestamp: 1 }], [], false),
      );

    const result = await loadProgressiveHiveAdvancedReport(baseBody);

    expect(result.report?.wallet).toHaveLength(2);
    expect(result.report?.wallet[0]?.operationIndex).toBe(2);
  });

  it('sets truncated when MAX_PROGRESSIVE_PAGES is exceeded', async () => {
    let calls = 0;
    fetchMock.mockImplementation(async () => {
      calls += 1;
      return pageResult(
        [{ userName: 'alice', operationIndex: calls, timestamp: calls }],
        [{ name: 'alice', cursor: calls, hasMore: true }],
        true,
      );
    });

    const result = await loadProgressiveHiveAdvancedReport(baseBody);

    expect(fetchMock.mock.calls.length).toBe(5000);
    expect(result.report?.truncated).toBe(true);
    expect(result.report?.hasMore).toBe(false);
  });

  it('returns unavailable when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await loadProgressiveHiveAdvancedReport(baseBody, {
      signal: controller.signal,
    });

    expect(result).toEqual({ report: null, error: 'unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
