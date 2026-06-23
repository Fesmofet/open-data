import { Test } from '@nestjs/testing';

import { HiveGlobalPropertiesCache } from '../feed/hive-global-properties.cache';
import { GetHiveAdvancedReportEndpoint } from './get-hive-advanced-report.endpoint';
import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';
import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';
import { WalletExemptionsRepository } from '../../repositories';

describe('GetHiveAdvancedReportEndpoint', () => {
  const chainContext = {
    totalVestingShares: '1000000 VESTS',
    totalVestingFundSteem: '1000.000 HIVE',
  };

  const row = (overrides: Partial<AdvancedReportRawRow>): AdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 10,
    timestamp: 1_700_000_000,
    type: 'transfer',
    from: 'bob',
    to: 'alice',
    amount: '1.000 HIVE',
    memo: '',
    payload: { from: 'bob', to: 'alice', amount: '1.000 HIVE' },
    ...overrides,
  });

  let pager: jest.Mocked<Pick<HiveAdvancedReportPagerService, 'collectForAccount'>>;
  let pricing: jest.Mocked<
    Pick<WalletAdvancedReportPricingService, 'enrichRows' | 'calcTotals'>
  >;
  let exemptions: jest.Mocked<Pick<WalletExemptionsRepository, 'findForViewerAndAccounts'>>;
  let hiveGlobalProperties: jest.Mocked<Pick<HiveGlobalPropertiesCache, 'getChainContextFields'>>;
  let endpoint: GetHiveAdvancedReportEndpoint;

  beforeEach(async () => {
    pager = { collectForAccount: jest.fn() };
    pricing = {
      enrichRows: jest.fn(),
      calcTotals: jest.fn(),
    };
    exemptions = { findForViewerAndAccounts: jest.fn().mockResolvedValue([]) };
    hiveGlobalProperties = {
      getChainContextFields: jest.fn().mockResolvedValue(chainContext),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetHiveAdvancedReportEndpoint,
        { provide: HiveAdvancedReportPagerService, useValue: pager },
        { provide: WalletAdvancedReportPricingService, useValue: pricing },
        { provide: WalletExemptionsRepository, useValue: exemptions },
        { provide: HiveGlobalPropertiesCache, useValue: hiveGlobalProperties },
      ],
    }).compile();

    endpoint = moduleRef.get(GetHiveAdvancedReportEndpoint);
  });

  it('merges multi-account rows and returns totals', async () => {
    pager.collectForAccount
      .mockResolvedValueOnce({
        rows: [row({ operationIndex: 11, timestamp: 2 })],
        pagingRows: [row({ operationIndex: 11, timestamp: 2 })],
        hasMore: false,
      })
      .mockResolvedValueOnce({
        rows: [row({ userName: 'bob', operationIndex: 9 })],
        pagingRows: [row({ userName: 'bob', operationIndex: 9 })],
        hasMore: false,
      });

    pricing.enrichRows.mockResolvedValue([
      {
        userName: 'alice',
        operationIndex: 11,
        timestamp: 2,
        type: 'transfer',
        from: 'bob',
        to: 'alice',
        amount: '1.000 HIVE',
        memo: '',
        hiveAmount: '1.000',
        hbdAmount: '',
        hpAmount: '',
        withdrawDeposit: 'd',
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
      },
    ]);
    pricing.calcTotals.mockReturnValue({ deposits: 1, withdrawals: 0 });

    const now = Math.floor(Date.now() / 1000);

    const result = await endpoint.execute({
      accounts: [{ name: 'alice' }, { name: 'bob' }],
      filterAccounts: ['alice', 'bob'],
      startDate: now - 86_400 * 30,
      endDate: now - 86_400,
      limit: 10,
      currency: 'USD',
    });

    expect(result.wallet).toHaveLength(1);
    expect(result.deposits).toBe(1);
    expect(pricing.enrichRows).toHaveBeenCalledWith(
      expect.objectContaining({ filterAccounts: ['alice', 'bob'] }),
    );
  });
});
