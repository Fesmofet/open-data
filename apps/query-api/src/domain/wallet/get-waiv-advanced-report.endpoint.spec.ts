import { Test } from '@nestjs/testing';

import { GetWaivAdvancedReportEndpoint } from './get-waiv-advanced-report.endpoint';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';
import { WalletExemptionsRepository } from '../../repositories';

describe('GetWaivAdvancedReportEndpoint', () => {
  const row = (overrides: Partial<WaivAdvancedReportRawRow>): WaivAdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 10,
    timestamp: 1_700_000_000,
    dateYmd: '2023-11-14',
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '100',
    memo: '',
    withdrawDeposit: 'd',
    payload: { from: 'bob', to: 'alice', quantity: '100' },
    cursor: 'abc',
    ...overrides,
  });

  let pager: jest.Mocked<Pick<WaivAdvancedReportPagerService, 'collectForAccount'>>;
  let pricing: jest.Mocked<
    Pick<WaivAdvancedReportPricingService, 'enrichRows' | 'calcTotals'>
  >;
  let exemptions: jest.Mocked<Pick<WalletExemptionsRepository, 'findForViewerAndAccounts'>>;
  let endpoint: GetWaivAdvancedReportEndpoint;

  beforeEach(async () => {
    pager = { collectForAccount: jest.fn() };
    pricing = {
      enrichRows: jest.fn(),
      calcTotals: jest.fn(),
    };
    exemptions = { findForViewerAndAccounts: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetWaivAdvancedReportEndpoint,
        { provide: WaivAdvancedReportPagerService, useValue: pager },
        { provide: WaivAdvancedReportPricingService, useValue: pricing },
        { provide: WalletExemptionsRepository, useValue: exemptions },
      ],
    }).compile();

    endpoint = moduleRef.get(GetWaivAdvancedReportEndpoint);
  });

  it('passes includeSwapsAndTrades to pager', async () => {
    pager.collectForAccount.mockResolvedValueOnce({
      rows: [row({})],
      pagingRows: [row({})],
      hasMore: false,
      lastCursor: null,
    });
    pricing.enrichRows.mockResolvedValue([]);
    pricing.calcTotals.mockReturnValue({ deposits: 0, withdrawals: 0 });

    const now = Math.floor(Date.now() / 1000);
    await endpoint.execute({
      accounts: [{ name: 'alice' }],
      filterAccounts: ['alice'],
      startDate: now - 86_400 * 30,
      endDate: now - 86_400,
      limit: 10,
      currency: 'USD',
      includeSwapsAndTrades: true,
    });

    expect(pager.collectForAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        includeSwapsAndTrades: true,
        filterAccounts: ['alice'],
      }),
    );
  });

  it('defaults includeSwapsAndTrades to false', async () => {
    pager.collectForAccount.mockResolvedValueOnce({
      rows: [],
      pagingRows: [],
      hasMore: false,
      lastCursor: null,
    });
    pricing.enrichRows.mockResolvedValue([]);
    pricing.calcTotals.mockReturnValue({ deposits: 0, withdrawals: 0 });

    await endpoint.execute({
      accounts: [{ name: 'alice' }],
      filterAccounts: ['alice'],
      limit: 10,
      currency: 'USD',
      includeSwapsAndTrades: false,
    });

    expect(pager.collectForAccount).toHaveBeenCalledWith(
      expect.objectContaining({ includeSwapsAndTrades: false }),
    );
  });

  it('loads exemptions for viewer and passes checkedKeys to pricing', async () => {
    pager.collectForAccount.mockResolvedValueOnce({
      rows: [row({ operationIndex: 42 })],
      pagingRows: [row({ operationIndex: 42 })],
      hasMore: false,
      lastCursor: null,
    });
    exemptions.findForViewerAndAccounts.mockResolvedValueOnce([
      {
        viewer: 'viewer1',
        account: 'alice',
        operation_index: 42,
        created_at: new Date(),
      },
    ]);
    pricing.enrichRows.mockResolvedValue([]);
    pricing.calcTotals.mockReturnValue({ deposits: 0, withdrawals: 0 });

    const now = Math.floor(Date.now() / 1000);
    await endpoint.execute({
      accounts: [{ name: 'alice' }],
      filterAccounts: ['alice'],
      startDate: now - 86_400 * 30,
      endDate: now - 86_400,
      limit: 10,
      currency: 'USD',
      includeSwapsAndTrades: false,
      viewer: 'Viewer1',
    });

    expect(exemptions.findForViewerAndAccounts).toHaveBeenCalledWith('viewer1', [
      'alice',
    ]);
    expect(pricing.enrichRows).toHaveBeenCalledWith(
      expect.objectContaining({
        checkedKeys: new Set(['alice:42']),
      }),
    );
  });

  it('skips exemption lookup when viewer is omitted', async () => {
    pager.collectForAccount.mockResolvedValueOnce({
      rows: [row({ operationIndex: 42 })],
      pagingRows: [row({ operationIndex: 42 })],
      hasMore: false,
      lastCursor: null,
    });
    pricing.enrichRows.mockResolvedValue([]);
    pricing.calcTotals.mockReturnValue({ deposits: 0, withdrawals: 0 });

    const now = Math.floor(Date.now() / 1000);
    await endpoint.execute({
      accounts: [{ name: 'alice' }],
      filterAccounts: ['alice'],
      startDate: now - 86_400 * 30,
      endDate: now - 86_400,
      limit: 10,
      currency: 'USD',
      includeSwapsAndTrades: false,
    });

    expect(exemptions.findForViewerAndAccounts).not.toHaveBeenCalled();
    expect(pricing.enrichRows).toHaveBeenCalledWith(
      expect.objectContaining({
        checkedKeys: new Set(),
      }),
    );
  });
});
