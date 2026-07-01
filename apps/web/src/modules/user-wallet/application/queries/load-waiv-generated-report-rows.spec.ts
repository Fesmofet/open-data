import { WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE } from '@opden-data-layer/core/waiv-advanced-report';

import { loadWaivGeneratedReportRows } from './load-waiv-generated-report-rows';
import type { WaivAdvancedReportRowApi } from '../dto/waiv-advanced-report-api.schema';

jest.mock('../../infrastructure/clients/waiv-generated-report.browser.client', () => ({
  listWaivGeneratedReportRowsClient: jest.fn(),
}));

import { listWaivGeneratedReportRowsClient } from '../../infrastructure/clients/waiv-generated-report.browser.client';

const listMock = listWaivGeneratedReportRowsClient as jest.MockedFunction<
  typeof listWaivGeneratedReportRowsClient
>;

function row(operationIndex: number): WaivAdvancedReportRowApi {
  return {
    userName: 'alice',
    operationIndex,
    timestamp: operationIndex,
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '1',
    memo: '',
    waivAmount: '1',
    wpAmount: '',
    withdrawDeposit: 'd',
    checked: false,
    waivUsd: 1,
    waivRateFiat: 1,
    waivFiat: 1,
    wpFiat: 0,
    totalFiat: 1,
    payload: {},
  };
}

describe('loadWaivGeneratedReportRows', () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it('loads all pages from skip zero', async () => {
    listMock
      .mockResolvedValueOnce({
        ok: true,
        data: { wallet: [row(1), row(2)], hasMore: true },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { wallet: [row(3)], hasMore: false },
      });

    const result = await loadWaivGeneratedReportRows('report-id');

    expect(result).toHaveLength(3);
    expect(listMock).toHaveBeenNthCalledWith(1, 'report-id', {
      skip: 0,
      limit: WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
    });
    expect(listMock).toHaveBeenNthCalledWith(2, 'report-id', {
      skip: 2,
      limit: WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
    });
  });

  it('appends only from startSkip when incremental', async () => {
    listMock.mockResolvedValueOnce({
      ok: true,
      data: { wallet: [row(3), row(4)], hasMore: false },
    });

    const batches: WaivAdvancedReportRowApi[][] = [];
    const result = await loadWaivGeneratedReportRows('report-id', {
      startSkip: 2,
      onBatch: (batch) => {
        batches.push(batch);
      },
    });

    expect(result).toEqual([row(3), row(4)]);
    expect(batches).toEqual([[row(3), row(4)]]);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith('report-id', {
      skip: 2,
      limit: WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
    });
  });

  it('returns null when a page request fails', async () => {
    listMock.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await loadWaivGeneratedReportRows('report-id');

    expect(result).toBeNull();
  });
});
