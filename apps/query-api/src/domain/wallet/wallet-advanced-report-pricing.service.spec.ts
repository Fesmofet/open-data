import { Test } from '@nestjs/testing';

import { HIVE_OP } from '@opden-data-layer/core/hive-account-history';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';

describe('WalletAdvancedReportPricingService', () => {
  let currencyQuery: jest.Mocked<
    Pick<CurrencyQueryService, 'getHiveHistoricalUsdByDates' | 'getFiatCrossRatesByDates'>
  >;
  let service: WalletAdvancedReportPricingService;

  beforeEach(async () => {
    currencyQuery = {
      getHiveHistoricalUsdByDates: jest.fn().mockResolvedValue(
        new Map([['2023-11-14', { hiveUsd: 0.25, hbdUsd: 1 }]]),
      ),
      getFiatCrossRatesByDates: jest.fn().mockResolvedValue(new Map([['2023-11-14', 1]])),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WalletAdvancedReportPricingService,
        { provide: CurrencyQueryService, useValue: currencyQuery },
      ],
    }).compile();

    service = moduleRef.get(WalletAdvancedReportPricingService);
  });

  const rawRow = (overrides: Partial<AdvancedReportRawRow>): AdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 1,
    timestamp: 1_700_000_000,
    type: HIVE_OP.TRANSFER,
    from: 'bob',
    to: 'alice',
    amount: '2.000 HIVE',
    memo: '',
    payload: {},
    ...overrides,
  });

  it('prices transfer rows in batch', async () => {
    const rows = await service.enrichRows({
      rows: [rawRow({})],
      filterAccounts: ['alice'],
      currency: 'USD',
      checkedKeys: new Set(),
      chainContext: {
        totalVestingShares: '1000000 VESTS',
        totalVestingFundSteem: '1000.000 HIVE',
      },
    });

    expect(rows[0]?.totalFiat).toBeGreaterThan(0);
    expect(rows[0]?.hiveRateFiat).toBeCloseTo(0.25, 5);
    expect(rows[0]?.hbdRateFiat).toBeCloseTo(1, 5);
    expect(rows[0]?.withdrawDeposit).toBe('d');
    expect(currencyQuery.getHiveHistoricalUsdByDates).toHaveBeenCalledTimes(1);
  });

  it('applies per-row historical rates from batch lookup', async () => {
    currencyQuery.getHiveHistoricalUsdByDates.mockResolvedValue(
      new Map([
        ['2020-06-23', { hiveUsd: 0.4, hbdUsd: 1 }],
        ['2021-11-14', { hiveUsd: 2.5, hbdUsd: 1 }],
      ]),
    );
    currencyQuery.getFiatCrossRatesByDates.mockResolvedValue(
      new Map([
        ['2020-06-23', 1],
        ['2021-11-14', 1],
      ]),
    );

    const rows = await service.enrichRows({
      rows: [
        rawRow({ timestamp: 1_592_899_200, amount: '10.000 HIVE' }),
        rawRow({ timestamp: 1_636_848_000, amount: '10.000 HIVE', operationIndex: 2 }),
      ],
      filterAccounts: ['alice'],
      currency: 'USD',
      checkedKeys: new Set(),
      chainContext: {
        totalVestingShares: '1000000 VESTS',
        totalVestingFundSteem: '1000.000 HIVE',
      },
    });

    expect(rows[0]?.totalFiat).toBeCloseTo(4, 5);
    expect(rows[1]?.totalFiat).toBeCloseTo(25, 5);
  });

  it('skips checked rows in totals', () => {
    const totals = service.calcTotals([
      {
        userName: 'alice',
        operationIndex: 1,
        timestamp: 1,
        type: HIVE_OP.TRANSFER,
        from: 'bob',
        to: 'alice',
        amount: '1 HIVE',
        memo: '',
        hiveAmount: '1',
        hbdAmount: '',
        hpAmount: '',
        withdrawDeposit: 'd',
        checked: true,
        hiveUsd: 1,
        hbdUsd: 1,
        hiveRateFiat: 1,
        hbdRateFiat: 1,
        hiveFiat: 1,
        hbdFiat: 0,
        hpFiat: 0,
        totalFiat: 5,
        payload: {},
      },
    ]);

    expect(totals.deposits).toBe(0);
  });
});
