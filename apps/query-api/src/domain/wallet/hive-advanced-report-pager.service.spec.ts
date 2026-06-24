import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow } from '@opden-data-layer/clients';
import { HIVE_OP } from '@opden-data-layer/core/hive-account-history';

import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';

function hivePage(rows: HiveAccountHistoryRow[]) {
  return { rows };
}

function transferOp(
  index: number,
  iso: string,
  from = 'bob',
  to = 'alice',
): HiveAccountHistoryRow {
  return [
    index,
    {
      trx_id: `tx-${index}`,
      block: 1,
      trx_in_block: 0,
      op_in_trx: 0,
      virtual_op: false,
      timestamp: iso,
      op: [HIVE_OP.TRANSFER, { from, to, amount: '1.000 HIVE', memo: '' }],
    },
  ];
}

describe('HiveAdvancedReportPagerService', () => {
  let hiveClient: jest.Mocked<Pick<HiveClient, 'getAccountHistory'>>;
  let pager: HiveAdvancedReportPagerService;

  const startDate = Math.floor(Date.parse('2024-01-01T00:00:00Z') / 1000);
  const endDate = Math.floor(Date.parse('2024-01-31T23:59:59Z') / 1000);

  beforeEach(() => {
    hiveClient = { getAccountHistory: jest.fn() };
    pager = new HiveAdvancedReportPagerService(hiveClient as unknown as HiveClient);
  });

  it('returns pagingRows with lookahead when collected exceeds targetCount', async () => {
    const ops = Array.from({ length: 11 }, (_, i) =>
      transferOp(100 - i, `2024-01-${String(15 - i).padStart(2, '0')}T12:00:00`),
    );
    hiveClient.getAccountHistory.mockResolvedValue(hivePage(ops));

    const result = await pager.collectForAccount({
      account: 'alice',
      cursor: -1,
      startDate,
      endDate,
      targetCount: 10,
    });

    expect(result.hasMore).toBe(true);
    expect(result.rows).toHaveLength(10);
    expect(result.pagingRows.length).toBeGreaterThan(10);
  });

  it('skips operations outside the date window', async () => {
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
        transferOp(3, '2025-02-01T12:00:00'),
        transferOp(4, '2024-01-10T12:00:00'),
      ]),
    );

    const result = await pager.collectForAccount({
      account: 'alice',
      cursor: -1,
      startDate,
      endDate,
      targetCount: 10,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.operationIndex).toBe(4);
  });

  it('skips honey-swap transfers when swapAccount is set', async () => {
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
        transferOp(2, '2024-01-10T12:00:00', 'alice', 'honey-swap'),
        transferOp(1, '2024-01-09T12:00:00', 'bob', 'alice'),
      ]),
    );

    const result = await pager.collectForAccount({
      account: 'alice',
      cursor: -1,
      startDate,
      endDate,
      targetCount: 10,
      swapAccount: 'honey-swap',
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.operationIndex).toBe(1);
  });

  it('includes ops outside a date window when dates are omitted (browse mode)', async () => {
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
        transferOp(3, '2025-02-01T12:00:00'),
        transferOp(4, '2024-01-10T12:00:00'),
      ]),
    );

    const result = await pager.collectForAccount({
      account: 'alice',
      cursor: -1,
      targetCount: 10,
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((r) => r.operationIndex).sort((a, b) => a - b)).toEqual([3, 4]);
  });

  it('orders pagingRows newest-first', async () => {
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
        transferOp(1, '2024-01-09T12:00:00'),
        transferOp(2, '2024-01-10T12:00:00'),
        transferOp(3, '2024-01-11T12:00:00'),
      ]),
    );

    const result = await pager.collectForAccount({
      account: 'alice',
      cursor: -1,
      startDate,
      endDate,
      targetCount: 10,
    });

    expect(result.pagingRows.length).toBeGreaterThanOrEqual(2);
    expect(result.pagingRows[0]?.timestamp).toBeGreaterThan(
      result.pagingRows[result.pagingRows.length - 1]!.timestamp,
    );
  });
});
