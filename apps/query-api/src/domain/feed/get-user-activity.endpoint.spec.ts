import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow } from '@opden-data-layer/clients';

import { GetUserActivityEndpoint } from './get-user-activity.endpoint';
import { encodeActivityCursor } from './activity-cursor';
import { mapHiveAccountHistoryRow } from './activity-item-dtos';

describe('GetUserActivityEndpoint', () => {
  let accounts: { findByName: jest.Mock };
  let hiveClient: jest.Mocked<
    Pick<HiveClient, 'getAccountHistory' | 'getDynamicGlobalProperties'>
  >;
  let endpoint: GetUserActivityEndpoint;

  beforeEach(() => {
    accounts = { findByName: jest.fn() };
    hiveClient = {
      getAccountHistory: jest.fn(),
      getDynamicGlobalProperties: jest.fn(),
    };
    endpoint = new GetUserActivityEndpoint(
      accounts as never,
      hiveClient as unknown as HiveClient,
    );
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(null);
    await expect(endpoint.execute('alice', { limit: 500 })).resolves.toBeNull();
  });

  it('returns newest-first items and cursor from oldest in batch', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100',
      total_vesting_fund_steem: '50',
    });
    hiveClient.getAccountHistory.mockResolvedValue([
      [
        10,
        {
          trx_id: 'abc',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:01',
          op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
        },
      ],
      [
        9,
        {
          trx_id: 'def',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:00',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
    ]);

    const result = await endpoint.execute('alice', { limit: 1 });
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.operationIndex).toBe(10);
    expect(result?.hasMore).toBe(true);
    expect(result?.cursor).toBe(encodeActivityCursor({ operationIndex: 9 }));
    expect(result?.chainContext.totalVestingShares).toBe('100');
  });

  it('sorts ascending Hive batches to newest-first', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100',
      total_vesting_fund_steem: '50',
    });
    hiveClient.getAccountHistory.mockResolvedValue([
      [
        9,
        {
          trx_id: 'older',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:00',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
      [
        10,
        {
          trx_id: 'newer',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:01',
          op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
        },
      ],
    ]);

    const result = await endpoint.execute('alice', { limit: 2 });
    expect(result?.items[0]?.operationIndex).toBe(10);
    expect(result?.items[1]?.operationIndex).toBe(9);
  });

  it('keeps paging Hive when hidden ops are filtered and more history exists', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100',
      total_vesting_fund_steem: '50',
    });

    const hiddenOp = (index: number): HiveAccountHistoryRow => [
      index,
      {
        trx_id: `hidden-${index}`,
        block: 1,
        trx_in_block: 0,
        op_in_trx: 0,
        virtual_op: false,
        timestamp: '2024-01-01T00:00:00',
        op: ['effective_comment_vote', {}],
      },
    ];

    const firstBatch: HiveAccountHistoryRow[] = [
      ...Array.from({ length: 17 }, (_, i) => hiddenOp(i + 1)),
      [
        18,
        {
          trx_id: 'vote',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:01',
          op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
        },
      ],
      hiddenOp(19),
      hiddenOp(20),
    ];

    hiveClient.getAccountHistory.mockResolvedValueOnce(firstBatch);
    hiveClient.getAccountHistory.mockResolvedValueOnce([
      [
        0,
        {
          trx_id: 'transfer',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:02',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
    ]);

    const result = await endpoint.execute('alice', { limit: 2 });
    expect(result?.items).toHaveLength(2);
    expect(result?.items[0]?.operationIndex).toBe(18);
    expect(result?.items[1]?.operationIndex).toBe(0);
    expect(result?.hasMore).toBe(false);
    expect(hiveClient.getAccountHistory).toHaveBeenCalledTimes(2);
    expect(hiveClient.getAccountHistory).toHaveBeenNthCalledWith(2, 'alice', 1, 100);
  });

  it('picks newest visible ops when Hive returns oldest-first rows', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100',
      total_vesting_fund_steem: '50',
    });
    hiveClient.getAccountHistory.mockResolvedValue([
      [
        58158,
        {
          trx_id: 'older',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2026-05-12T00:00:00',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
      [
        58167,
        {
          trx_id: 'newest',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2026-05-18T00:00:00',
          op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
        },
      ],
    ]);

    const result = await endpoint.execute('alice', { limit: 1 });
    expect(result?.items[0]?.operationIndex).toBe(58167);
    expect(result?.items[0]?.trxId).toBe('newest');
  });

  it('skips operations newer than the cursor anchor on the first Hive batch', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getDynamicGlobalProperties.mockResolvedValue({
      total_vesting_shares: '100',
      total_vesting_fund_steem: '50',
    });
    hiveClient.getAccountHistory.mockResolvedValue([
      [
        2,
        {
          trx_id: 'overlap',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:00',
          op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
        },
      ],
      [
        1,
        {
          trx_id: 'fresh',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:01',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
    ]);

    const cursor = encodeActivityCursor({ operationIndex: 1 });
    const result = await endpoint.execute('alice', { limit: 20, cursor });
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.operationIndex).toBe(1);
    expect(result?.items[0]?.trxId).toBe('fresh');
  });

  it('throws BadRequestException for invalid cursor', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    await expect(
      endpoint.execute('alice', { limit: 20, cursor: 'not-a-valid-cursor' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ServiceUnavailableException when Hive history is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(null);
    await expect(endpoint.execute('alice', { limit: 20 })).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});

describe('mapHiveAccountHistoryRow', () => {
  it('filters effective_comment_vote', () => {
    expect(
      mapHiveAccountHistoryRow([
        1,
        {
          trx_id: 'x',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:00',
          op: ['effective_comment_vote', {}],
        },
      ]),
    ).toBeNull();
  });
});
