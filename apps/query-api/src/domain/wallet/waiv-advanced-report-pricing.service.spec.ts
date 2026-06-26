import { Test } from '@nestjs/testing';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';

describe('WaivAdvancedReportPricingService', () => {
  let service: WaivAdvancedReportPricingService;
  let currencyQuery: jest.Mocked<
    Pick<CurrencyQueryService, 'getEngineHistoricalUsdByDates' | 'getFiatCrossRatesByDates'>
  >;

  const rawRow = (overrides: Partial<WaivAdvancedReportRawRow>): WaivAdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 1,
    timestamp: 1_704_067_200,
    dateYmd: '2024-01-01',
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '10',
    memo: '',
    withdrawDeposit: 'd',
    payload: {},
    cursor: 'x',
    ...overrides,
  });

  beforeEach(async () => {
    currencyQuery = {
      getEngineHistoricalUsdByDates: jest.fn().mockResolvedValue(new Map([['2024-01-01', 0.1]])),
      getFiatCrossRatesByDates: jest.fn().mockResolvedValue(new Map([['2024-01-01', 1]])),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WaivAdvancedReportPricingService,
        { provide: CurrencyQueryService, useValue: currencyQuery },
      ],
    }).compile();

    service = moduleRef.get(WaivAdvancedReportPricingService);
  });

  it('splits WAIV and WP display amounts', async () => {
    const rows = await service.enrichRows({
      rows: [
        rawRow({ type: 'tokens_transfer', amount: '10' }),
        rawRow({ type: 'tokens_stake', amount: '5', operationIndex: 2 }),
      ],
      currency: 'USD',
      checkedKeys: new Set(),
    });

    expect(rows[0]?.waivAmount).toBe('10');
    expect(rows[0]?.wpAmount).toBe('');
    expect(rows[1]?.waivAmount).toBe('');
    expect(rows[1]?.wpAmount).toBe('5');
    expect(rows[0]?.totalFiat).toBeCloseTo(1);
  });
});
