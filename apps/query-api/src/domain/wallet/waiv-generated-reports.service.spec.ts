import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { WaivGeneratedReportsService } from './waiv-generated-reports.service';
import { WaivGeneratedReportsRepository } from '../../repositories/waiv-generated-reports.repository';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';
import { WAIV_GENERATED_REPORT_STATUS } from '../../constants/waiv-generated-report.constants';
import type { WaivAdvancedReportRowDto } from './schemas/waiv-advanced-report.schema';
import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';
import type { WaivGeneratedReport } from '@opden-data-layer/core';
import type { JsonValue } from '@opden-data-layer/core';

describe('WaivGeneratedReportsService', () => {
  let service: WaivGeneratedReportsService;
  let pager: jest.Mocked<Pick<WaivAdvancedReportPagerService, 'collectForAccount'>>;
  let pricing: jest.Mocked<Pick<WaivAdvancedReportPricingService, 'enrichRows'>>;
  let reports: jest.Mocked<
    Pick<
      WaivGeneratedReportsRepository,
      | 'countActiveByOwner'
      | 'insertReport'
      | 'findById'
      | 'listByOwner'
      | 'toggleRowChecked'
      | 'updateReport'
      | 'insertRows'
      | 'countRows'
      | 'recalcTotals'
      | 'listStoredRows'
      | 'deleteByIdAndOwner'
    >
  >;

  const sampleReport: WaivGeneratedReport = {
    id: '11111111-1111-1111-1111-111111111111',
    owner: 'alice',
    profile_account: 'alice',
    status: WAIV_GENERATED_REPORT_STATUS.pending,
    currency: 'USD',
    start_date_ts: 1,
    end_date_ts: 2,
    filter_accounts: ['alice'],
    include_swaps_and_trades: false,
    merge_rewards: true,
    merge_reward_fold: null,
    accounts_progress: [{ name: 'alice', cursor: null, hasMore: true }],
    deposits: '0',
    withdrawals: '0',
    row_count: 0,
    error_message: null,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
    completed_at: null,
  };

  const cloneReport = (overrides: Partial<WaivGeneratedReport> = {}): WaivGeneratedReport => ({
    ...sampleReport,
    accounts_progress: sampleReport.accounts_progress.map((entry) => ({ ...entry })),
    ...overrides,
  });

  const rawRewardRow = (
    overrides: Partial<WaivAdvancedReportRawRow> = {},
  ): WaivAdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 1,
    timestamp: 1_700_000_000,
    dateYmd: '2023-11-14',
    type: 'comments_curationReward',
    from: '',
    to: 'alice',
    amount: '1',
    memo: '',
    withdrawDeposit: 'd',
    payload: { authorperm: '@a/post-1' },
    cursor: 'cursor-1',
    ...overrides,
  });

  const rawTransferRow = (
    overrides: Partial<WaivAdvancedReportRawRow> = {},
  ): WaivAdvancedReportRawRow => ({
    userName: 'alice',
    operationIndex: 99,
    timestamp: 1_699_999_000,
    dateYmd: '2023-11-13',
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '10',
    memo: '',
    withdrawDeposit: 'd',
    payload: {},
    cursor: 'cursor-2',
    ...overrides,
  });

  const pricedRow = (
    overrides: Partial<WaivAdvancedReportRowDto> = {},
  ): WaivAdvancedReportRowDto => ({
    userName: 'alice',
    operationIndex: 1,
    timestamp: 1_700_000_000,
    type: 'comments_curationReward',
    from: '',
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
    payload: { authorperm: '@a/post-1' },
    ...overrides,
  });

  const transferRow = (
    overrides: Partial<WaivAdvancedReportRowDto> = {},
  ): WaivAdvancedReportRowDto => ({
    userName: 'alice',
    operationIndex: 99,
    timestamp: 1_699_999_000,
    type: 'tokens_transfer',
    from: 'bob',
    to: 'alice',
    amount: '10',
    memo: '',
    waivAmount: '10',
    wpAmount: '',
    withdrawDeposit: 'd',
    checked: false,
    waivUsd: 1,
    waivRateFiat: 1,
    waivFiat: 10,
    wpFiat: 0,
    totalFiat: 10,
    payload: {},
    ...overrides,
  });

  const pagerResult = (
    rows: WaivAdvancedReportRawRow[],
    hasMore: boolean,
    lastCursor: string | null = null,
  ) => ({
    rows,
    pagingRows: rows,
    hasMore,
    lastCursor,
  });

  beforeEach(async () => {
    pager = { collectForAccount: jest.fn() };
    pricing = { enrichRows: jest.fn() };

    reports = {
      countActiveByOwner: jest.fn().mockResolvedValue(0),
      insertReport: jest.fn().mockResolvedValue(cloneReport()),
      findById: jest.fn().mockResolvedValue(cloneReport()),
      listByOwner: jest.fn().mockResolvedValue([cloneReport()]),
      toggleRowChecked: jest.fn().mockResolvedValue(true),
      updateReport: jest.fn().mockResolvedValue(true),
      insertRows: jest.fn().mockResolvedValue(1),
      countRows: jest.fn().mockResolvedValue(1),
      recalcTotals: jest.fn().mockResolvedValue({ deposits: 1, withdrawals: 0 }),
      listStoredRows: jest.fn().mockResolvedValue([]),
      deleteByIdAndOwner: jest.fn().mockResolvedValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WaivGeneratedReportsService,
        { provide: WaivGeneratedReportsRepository, useValue: reports },
        { provide: WaivAdvancedReportPagerService, useValue: pager },
        { provide: WaivAdvancedReportPricingService, useValue: pricing },
      ],
    }).compile();

    service = moduleRef.get(WaivGeneratedReportsService);
  });

  it('creates a pending report', async () => {
    const now = Math.floor(Date.now() / 1000) - 86_400;
    const result = await service.createReport('alice', {
      profileAccount: 'alice',
      filterAccounts: ['alice'],
      startDate: now - 86_400 * 30,
      endDate: now,
      currency: 'USD',
      includeSwapsAndTrades: false,
      mergeRewards: true,
    });
    expect(result.id).toBe(sampleReport.id);
    expect(reports.insertReport).toHaveBeenCalled();
  });

  it('rejects when concurrent limit reached', async () => {
    reports.countActiveByOwner.mockResolvedValueOnce(12);
    await expect(
      service.createReport('alice', {
        profileAccount: 'alice',
        filterAccounts: ['alice'],
        startDate: 1,
        endDate: 2,
        currency: 'USD',
        includeSwapsAndTrades: false,
        mergeRewards: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids access for non-owner', async () => {
    await expect(service.getReport('bob', sampleReport.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes an owned report', async () => {
    await expect(service.deleteReport('alice', sampleReport.id)).resolves.toBeUndefined();
    expect(reports.deleteByIdAndOwner).toHaveBeenCalledWith(sampleReport.id, 'alice');
  });

  it('stopReport flushes pending merge_reward_fold and clears fold state', async () => {
    const runningReport = cloneReport({
      status: WAIV_GENERATED_REPORT_STATUS.inProgress,
      merge_reward_fold: {
        anchorTimestamp: 1_700_000_000,
        group: [
          pricedRow({ operationIndex: 1, amount: '2', totalFiat: 2, waivFiat: 2 }),
        ],
      } as unknown as JsonValue,
    });
    const stoppedReport = {
      ...runningReport,
      status: WAIV_GENERATED_REPORT_STATUS.stopped,
      merge_reward_fold: null,
      row_count: 2,
      deposits: '2',
    };

    reports.findById
      .mockResolvedValueOnce(runningReport)
      .mockResolvedValueOnce(stoppedReport);
    reports.recalcTotals.mockResolvedValueOnce({ deposits: 2, withdrawals: 0 });
    reports.countRows.mockResolvedValueOnce(2);

    const result = await service.stopReport('alice', sampleReport.id);

    expect(reports.insertRows).toHaveBeenCalledTimes(1);
    const inserted = reports.insertRows.mock.calls[0]?.[0] ?? [];
    expect(inserted).toHaveLength(1);
    expect(inserted[0]?.row).toMatchObject({ type: 'merged_rewards', amount: '2' });
    expect(reports.updateReport).toHaveBeenCalledWith(
      sampleReport.id,
      expect.objectContaining({
        status: WAIV_GENERATED_REPORT_STATUS.stopped,
        merge_reward_fold: null,
        deposits: 2,
        row_count: 2,
      }),
    );
    expect(result.status).toBe(WAIV_GENERATED_REPORT_STATUS.stopped);
  });

  describe('processNextBatch', () => {
    it('prices rows before merge and persists merged totalFiat sum', async () => {
      const pagerRows = [
        rawRewardRow({ operationIndex: 10, amount: '100' }),
        rawRewardRow({
          operationIndex: 11,
          type: 'comments_authorReward',
          amount: '100',
          payload: { authorperm: '@b/post-2' },
        }),
        rawTransferRow(),
      ];
      const pricedRows = [
        pricedRow({ operationIndex: 10, amount: '100', totalFiat: 1.1, waivFiat: 1.1 }),
        pricedRow({
          operationIndex: 11,
          type: 'comments_authorReward',
          amount: '100',
          totalFiat: 1.4,
          waivFiat: 1.4,
          payload: { authorperm: '@b/post-2' },
        }),
        transferRow(),
      ];

      pager.collectForAccount.mockResolvedValue(
        pagerResult(pagerRows, false, 'cursor-1'),
      );
      pricing.enrichRows.mockImplementation(async ({ rows }) => {
        expect(rows).toBe(pagerRows);
        return pricedRows;
      });

      await service.processNextBatch(sampleReport.id);

      expect(pricing.enrichRows).toHaveBeenCalled();
      expect(reports.insertRows).toHaveBeenCalled();
      expect(pricing.enrichRows.mock.invocationCallOrder[0]).toBeLessThan(
        reports.insertRows.mock.invocationCallOrder[0]!,
      );
      const inserted = reports.insertRows.mock.calls[0]?.[0] ?? [];
      const merged = inserted.find(
        (row) => (row.row as WaivAdvancedReportRowDto).type === 'merged_rewards',
      );
      expect(merged?.row).toMatchObject({
        totalFiat: 2.5,
        waivFiat: 2.5,
        amount: '200',
      });
      expect(reports.updateReport).toHaveBeenCalledWith(
        sampleReport.id,
        expect.objectContaining({
          status: WAIV_GENERATED_REPORT_STATUS.completed,
          merge_reward_fold: null,
        }),
      );
    });

    it('carries merge_reward_fold across batches until a non-reward break', async () => {
      const batch1Rows = [
        rawRewardRow({ operationIndex: 1, amount: '0.5' }),
        rawRewardRow({
          operationIndex: 2,
          type: 'comments_authorReward',
          amount: '1.5',
          payload: { authorperm: '@b/post-2' },
        }),
      ];
      const batch1Report = cloneReport({
        status: WAIV_GENERATED_REPORT_STATUS.inProgress,
      });

      reports.findById.mockResolvedValueOnce(batch1Report);
      pager.collectForAccount.mockResolvedValueOnce(
        pagerResult(batch1Rows, true, 'cursor-1'),
      );
      pricing.enrichRows.mockResolvedValueOnce([
        pricedRow({ operationIndex: 1, amount: '0.5' }),
        pricedRow({
          operationIndex: 2,
          type: 'comments_authorReward',
          amount: '1.5',
          payload: { authorperm: '@b/post-2' },
        }),
      ]);

      await service.processNextBatch(sampleReport.id);

      expect(reports.insertRows).not.toHaveBeenCalled();
      expect(reports.updateReport).toHaveBeenCalledWith(
        sampleReport.id,
        expect.objectContaining({
          merge_reward_fold: expect.objectContaining({
            group: expect.arrayContaining([
              expect.objectContaining({ operationIndex: 1 }),
              expect.objectContaining({ operationIndex: 2 }),
            ]),
          }),
        }),
      );

      const batch2Report = cloneReport({
        status: WAIV_GENERATED_REPORT_STATUS.inProgress,
        merge_reward_fold: reports.updateReport.mock.calls[0]?.[1]
          ?.merge_reward_fold as JsonValue,
        accounts_progress: [{ name: 'alice', cursor: 'cursor-1', hasMore: true }],
      });
      reports.findById.mockResolvedValueOnce(batch2Report);
      pager.collectForAccount.mockResolvedValueOnce(
        pagerResult([rawTransferRow()], false, null),
      );
      pricing.enrichRows.mockResolvedValueOnce([transferRow()]);

      await service.processNextBatch(sampleReport.id);

      const inserted = reports.insertRows.mock.calls[0]?.[0] ?? [];
      expect(inserted).toHaveLength(2);
      expect(inserted[0]?.row).toMatchObject({ type: 'merged_rewards', amount: '2' });
      expect(reports.updateReport).toHaveBeenLastCalledWith(
        sampleReport.id,
        expect.objectContaining({
          merge_reward_fold: null,
          status: WAIV_GENERATED_REPORT_STATUS.completed,
        }),
      );
    });

    it('flushes pending fold when the account finishes with rewards still folded', async () => {
      const inProgressReport = cloneReport({
        status: WAIV_GENERATED_REPORT_STATUS.inProgress,
      });
      reports.findById.mockResolvedValueOnce(inProgressReport);

      pager.collectForAccount.mockResolvedValueOnce(
        pagerResult([rawRewardRow({ amount: '3' })], false, null),
      );
      pricing.enrichRows.mockResolvedValueOnce([pricedRow({ amount: '3' })]);

      await service.processNextBatch(sampleReport.id);

      const inserted = reports.insertRows.mock.calls[0]?.[0] ?? [];
      expect(inserted).toHaveLength(1);
      expect(inserted[0]?.row).toMatchObject({ type: 'merged_rewards', amount: '3' });
      expect(reports.updateReport).toHaveBeenCalledWith(
        sampleReport.id,
        expect.objectContaining({
          merge_reward_fold: null,
          status: WAIV_GENERATED_REPORT_STATUS.completed,
        }),
      );
    });
  });
});
