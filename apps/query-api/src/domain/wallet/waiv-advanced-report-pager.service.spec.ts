import { Test } from '@nestjs/testing';
import { HiveEngineHistoryClient } from '@opden-data-layer/clients';

import {
  HiveEngineSwapsRepository,
  HiveEngineWaivAirdropsRepository,
} from '../../repositories';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { encodeWaivWalletHistoryCursor } from './waiv-wallet-history-cursor';

describe('WaivAdvancedReportPagerService', () => {
  let service: WaivAdvancedReportPagerService;
  let historyClient: jest.Mocked<Pick<HiveEngineHistoryClient, 'accountHistoryWithStatus'>>;
  let swapsRepo: jest.Mocked<Pick<HiveEngineSwapsRepository, 'findWaivByAccount'>>;
  let airdropsRepo: jest.Mocked<Pick<HiveEngineWaivAirdropsRepository, 'findByAccount'>>;

  beforeEach(async () => {
    historyClient = { accountHistoryWithStatus: jest.fn() };
    swapsRepo = { findWaivByAccount: jest.fn().mockResolvedValue([]) };
    airdropsRepo = { findByAccount: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WaivAdvancedReportPagerService,
        { provide: HiveEngineHistoryClient, useValue: historyClient },
        { provide: HiveEngineSwapsRepository, useValue: swapsRepo },
        { provide: HiveEngineWaivAirdropsRepository, useValue: airdropsRepo },
      ],
    }).compile();

    service = moduleRef.get(WaivAdvancedReportPagerService);
  });

  it('excludes PG swaps when includeSwapsAndTrades is false', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [
        {
          account: 'alice',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx1',
          quantity: '10',
          symbol: 'WAIV',
          from: 'bob',
          to: 'alice',
        },
      ],
      unavailable: false,
    });

    await service.collectForAccount({
      account: 'alice',
      cursor: null,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['alice'],
    });

    expect(swapsRepo.findWaivByAccount).not.toHaveBeenCalled();
    expect(airdropsRepo.findByAccount).toHaveBeenCalled();
  });

  it('includes classified transfer rows only', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [
        {
          account: 'alice',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx1',
          quantity: '10',
          symbol: 'WAIV',
          from: 'bob',
          to: 'alice',
        },
        {
          account: 'alice',
          operation: 'market_placeOrder',
          timestamp: 1_699_999_000,
          transactionId: 'tx2',
          quantity: '5',
          symbol: 'WAIV',
        },
      ],
      unavailable: false,
    });

    const result = await service.collectForAccount({
      account: 'alice',
      cursor: null,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['alice'],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.type).toBe('tokens_transfer');
    expect(result.rows[0]?.withdrawDeposit).toBe('d');
  });

  it('uses cursor timestamp as RPC upper bound when paginating within a date range', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [],
      unavailable: false,
    });

    const dateRange = { startDate: 1_600_000_000, endDate: 1_800_000_000 };
    const cursor = encodeWaivWalletHistoryCursor({
      timestamp: 1_700_000_000,
      tieId: 'tx1:tokens_transfer:1',
      source: 'rpc',
    });

    await service.collectForAccount({
      account: 'alice',
      cursor,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['alice'],
    });

    expect(historyClient.accountHistoryWithStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        timestampStart: dateRange.startDate,
        timestampEnd: 1_700_000_000,
      }),
    );
  });

  it('keeps distinct reward rows that share transactionId and operation', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [
        {
          account: 'grampo',
          operation: 'comments_curationReward',
          timestamp: 1_700_000_000,
          transactionId: 'tx-reward',
          authorperm: '@author/post-a',
          quantity: '0.16709602',
          symbol: 'WAIV',
          to: 'grampo',
        },
        {
          account: 'grampo',
          operation: 'comments_curationReward',
          timestamp: 1_700_000_000,
          transactionId: 'tx-reward',
          authorperm: '@author/post-b',
          quantity: '0.16711291',
          symbol: 'WAIV',
          to: 'grampo',
        },
      ],
      unavailable: false,
    });

    const result = await service.collectForAccount({
      account: 'grampo',
      cursor: null,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['grampo'],
    });

    expect(result.rows).toHaveLength(2);
    expect(new Set(result.rows.map((row) => row.operationIndex)).size).toBe(2);
  });

  it('keeps distinct transfers with the same amount in one transaction', async () => {
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [
        {
          account: 'grampo',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx-batch',
          quantity: '1500',
          symbol: 'WAIV',
          from: 'grampo',
          to: 'jeffjagoe',
        },
        {
          account: 'grampo',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx-batch',
          quantity: '1500',
          symbol: 'WAIV',
          from: 'grampo',
          to: 'gmamba13',
        },
      ],
      unavailable: false,
    });

    const result = await service.collectForAccount({
      account: 'grampo',
      cursor: null,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['grampo'],
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((row) => row.to).sort()).toEqual(['gmamba13', 'jeffjagoe']);
    const indices = result.rows.map((row) => row.operationIndex).sort((a, b) => a - b);
    expect(indices).toEqual([863_919_321, 1_958_190_689]);
  });

  it('returns same-timestamp transfer siblings across pagination boundaries', async () => {
    const newerRows = Array.from({ length: 10 }, (_, i) => ({
      account: 'grampo',
      operation: 'comments_authorReward',
      timestamp: 1_800_000_000,
      transactionId: `tx-new-${i}`,
      authorperm: `@author/post-${i}`,
      quantity: '1',
      symbol: 'WAIV',
      to: 'grampo',
    }));
    historyClient.accountHistoryWithStatus.mockResolvedValue({
      entries: [
        ...newerRows,
        {
          account: 'grampo',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx-batch',
          quantity: '1500',
          symbol: 'WAIV',
          from: 'grampo',
          to: 'jeffjagoe',
        },
        {
          account: 'grampo',
          operation: 'tokens_transfer',
          timestamp: 1_700_000_000,
          transactionId: 'tx-batch',
          quantity: '1500',
          symbol: 'WAIV',
          from: 'grampo',
          to: 'gmamba13',
        },
      ],
      unavailable: false,
    });

    const page1 = await service.collectForAccount({
      account: 'grampo',
      cursor: null,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['grampo'],
    });

    expect(page1.rows).toHaveLength(10);
    expect(page1.lastCursor).not.toBeNull();

    const page2 = await service.collectForAccount({
      account: 'grampo',
      cursor: page1.lastCursor,
      targetCount: 11,
      includeSwapsAndTrades: false,
      filterAccounts: ['grampo'],
    });

    const transferTos = [...page1.rows, ...page2.rows]
      .filter((row) => row.type === 'tokens_transfer')
      .map((row) => row.to)
      .sort();
    expect(transferTos).toEqual(['gmamba13', 'jeffjagoe']);
  });
});
