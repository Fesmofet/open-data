import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow } from '@opden-data-layer/clients';
import { buildActivityFilterMask } from '@opden-data-layer/core/hive-account-history';

import { GetUserActivityEndpoint } from './get-user-activity.endpoint';
import { HiveGlobalPropertiesCache } from './hive-global-properties.cache';
import { encodeActivityCursor } from './activity-cursor';
import { mapHiveAccountHistoryRow } from './activity-item-dtos';

function hivePage(
  rows: HiveAccountHistoryRow[],
  continueFrom?: number,
) {
  return continueFrom === undefined ? { rows } : { rows, continueFrom };
}

describe('GetUserActivityEndpoint', () => {
  let accounts: { findByName: jest.Mock };
  let hiveClient: jest.Mocked<Pick<HiveClient, 'getAccountHistory'>>;
  let hiveGlobalProperties: jest.Mocked<
    Pick<HiveGlobalPropertiesCache, 'getChainContextFields'>
  >;
  let endpoint: GetUserActivityEndpoint;

  beforeEach(() => {
    accounts = { findByName: jest.fn() };
    hiveClient = {
      getAccountHistory: jest.fn(),
    };
    hiveGlobalProperties = {
      getChainContextFields: jest.fn().mockResolvedValue({
        totalVestingShares: '100',
        totalVestingFundSteem: '50',
      }),
    };
    endpoint = new GetUserActivityEndpoint(
      accounts as never,
      hiveClient as unknown as HiveClient,
      hiveGlobalProperties as unknown as HiveGlobalPropertiesCache,
    );
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(null);
    await expect(endpoint.execute('alice', { limit: 500, filters: [] })).resolves.toBeNull();
  });

  it('returns newest-first items and cursor from oldest in batch', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
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
    ]));

    const result = await endpoint.execute('alice', { limit: 1, filters: [] });
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.operationIndex).toBe(10);
    expect(result?.hasMore).toBe(true);
    expect(result?.cursor).toBe(encodeActivityCursor({ operationIndex: 9 }));
    expect(result?.chainContext.totalVestingShares).toBe('100');
  });

  it('uses chain context from HiveGlobalPropertiesCache', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveGlobalProperties.getChainContextFields.mockResolvedValue({
      totalVestingShares: '100',
      totalVestingFundSteem: '210616861.512 HIVE',
    });
    hiveClient.getAccountHistory.mockResolvedValue(hivePage([]));

    const result = await endpoint.execute('alice', { limit: 1, filters: [] });

    expect(result?.chainContext.totalVestingFundSteem).toBe('210616861.512 HIVE');
  });

  it('sorts ascending Hive batches to newest-first', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
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
    ]));

    const result = await endpoint.execute('alice', { limit: 2, filters: [] });
    expect(result?.items[0]?.operationIndex).toBe(10);
    expect(result?.items[1]?.operationIndex).toBe(9);
  });

  it('keeps paging Hive when hidden ops are filtered and more history exists', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
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

    hiveClient.getAccountHistory.mockResolvedValueOnce(hivePage(firstBatch));
    hiveClient.getAccountHistory.mockResolvedValueOnce(
      hivePage([
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
    ]));

    const result = await endpoint.execute('alice', { limit: 2, filters: [] });
    expect(result?.items).toHaveLength(2);
    expect(result?.items[0]?.operationIndex).toBe(18);
    expect(result?.items[1]?.operationIndex).toBe(0);
    expect(result?.hasMore).toBe(false);
    expect(hiveClient.getAccountHistory).toHaveBeenCalledTimes(2);
    expect(hiveClient.getAccountHistory).toHaveBeenNthCalledWith(2, 'alice', 1, 2, undefined);
  });

  it('picks newest visible ops when Hive returns oldest-first rows', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
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
    ]));

    const result = await endpoint.execute('alice', { limit: 1, filters: [] });
    expect(result?.items[0]?.operationIndex).toBe(58167);
    expect(result?.items[0]?.trxId).toBe('newest');
  });

  it('skips operations newer than the cursor anchor on the first Hive batch', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
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
    ]));

    const cursor = encodeActivityCursor({ operationIndex: 1 });
    const result = await endpoint.execute('alice', { limit: 20, cursor, filters: [] });
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.operationIndex).toBe(1);
    expect(result?.items[0]?.trxId).toBe('fresh');
  });

  it('throws BadRequestException for invalid cursor', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    await expect(
      endpoint.execute('alice', { limit: 20, cursor: 'not-a-valid-cursor', filters: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ServiceUnavailableException when Hive history is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(null);
    await expect(endpoint.execute('alice', { limit: 20, filters: [] })).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('passes Hive bitmask for reward filters and post-filters semantically', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory
      .mockResolvedValueOnce(
        hivePage([
          [
            2,
            {
              trx_id: 'cur',
              block: 1,
              trx_in_block: 0,
              op_in_trx: 0,
              virtual_op: true,
              timestamp: '2024-01-01T00:00:01',
              op: [
                'curation_reward',
                { author: 'bob', permlink: 'p', curator: 'alice', payout: '0.001 HBD' },
              ],
            },
          ],
          [
            1,
            {
              trx_id: 'vote',
              block: 1,
              trx_in_block: 0,
              op_in_trx: 0,
              virtual_op: false,
              timestamp: '2024-01-01T00:00:00',
              op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
            },
          ],
        ]),
      )
      .mockResolvedValueOnce(hivePage([]))
      .mockResolvedValue(hivePage([]));

    const result = await endpoint.execute('alice', {
      limit: 20,
      filters: ['curation_reward'],
    });

    expect(hiveClient.getAccountHistory).toHaveBeenCalledWith(
      'alice',
      -1,
      1000,
      buildActivityFilterMask(['curation_reward']),
    );
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]?.trxId).toBe('cur');
  });

  it('returns hasMore false when rare filter matches are exhausted before page fill', async () => {
    accounts.findByName.mockResolvedValue({ name: 'flowmaster' });
    const authorReward = (index: number): HiveAccountHistoryRow => [
      index,
      {
        trx_id: `author-${index}`,
        block: 1,
        trx_in_block: 0,
        op_in_trx: 0,
        virtual_op: true,
        timestamp: '2021-09-06T00:00:00',
        op: [
          'author_reward',
          {
            author: 'flowmaster',
            permlink: `post-${index}`,
            hbd_payout: '0.009 HBD',
            hive_payout: '0.000 HIVE',
            vesting_payout: '0.016 VESTS',
          },
        ],
      },
    ];

    hiveClient.getAccountHistory.mockImplementation((_account, from) => {
      if (from < 0 || from > 1339) {
        return Promise.resolve(
          hivePage([authorReward(1339), authorReward(1356)]),
        );
      }
      return Promise.resolve(hivePage([]));
    });

    const result = await endpoint.execute('flowmaster', {
      limit: 20,
      filters: ['author_reward'],
    });

    expect(result?.items).toHaveLength(2);
    expect(result?.hasMore).toBe(false);
    expect(result?.cursor).toBeNull();
  });

  it('returns hasMore when filtered scan stops before history end with no matches yet', async () => {
    accounts.findByName.mockResolvedValue({ name: 'flowmaster' });
    const voteRow = (index: number): HiveAccountHistoryRow => [
      index,
      {
        trx_id: `vote-${index}`,
        block: 1,
        trx_in_block: 0,
        op_in_trx: 0,
        virtual_op: false,
        timestamp: '2024-01-01T00:00:00',
        op: ['vote', { voter: 'flowmaster', author: 'bob', permlink: 'p', weight: 10000 }],
      },
    ];

    hiveClient.getAccountHistory.mockImplementation((_account, from, limit) => {
      const start = from < 0 ? 81_000 : from;
      const end = Math.max(0, start - limit + 1);
      const rows: HiveAccountHistoryRow[] = [];
      for (let index = end; index <= start; index++) {
        rows.push(voteRow(index));
      }
      return Promise.resolve(hivePage(rows));
    });

    const result = await endpoint.execute('flowmaster', {
      limit: 20,
      filters: ['author_reward'],
    });

    expect(result?.items).toHaveLength(0);
    expect(result?.hasMore).toBe(true);
    expect(result?.cursor).not.toBeNull();
    expect(hiveClient.getAccountHistory.mock.calls.length).toBeGreaterThan(2);
  });

  it('applies semantic transfer filter after Hive returns rows', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountHistory.mockResolvedValue(
      hivePage([
      [
        2,
        {
          trx_id: 'in',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:01',
          op: ['transfer', { from: 'bob', to: 'alice', amount: '1.000 HIVE', memo: '' }],
        },
      ],
      [
        1,
        {
          trx_id: 'out',
          block: 1,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: false,
          timestamp: '2024-01-01T00:00:00',
          op: ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }],
        },
      ],
    ]));

    const receivedOnly = await endpoint.execute('alice', {
      limit: 20,
      filters: ['received'],
    });
    expect(receivedOnly?.items).toHaveLength(1);
    expect(receivedOnly?.items[0]?.trxId).toBe('in');
  });

  it('load more with filters shrinks Hive limit when cursor is near history start', async () => {
    accounts.findByName.mockResolvedValue({ name: 'flowmaster' });
    const followOp = (index: number): HiveAccountHistoryRow => [
      index,
      {
        trx_id: `follow-${index}`,
        block: 1,
        trx_in_block: 0,
        op_in_trx: 0,
        virtual_op: false,
        timestamp: '2024-01-01T00:00:00',
        op: [
          'custom_json',
          {
            id: 'follow',
            json: JSON.stringify([
              'follow',
              {
                follower: 'flowmaster',
                following: 'bob',
                what: ['blog'],
              },
            ]),
            required_auths: [],
            required_posting_auths: ['flowmaster'],
          },
        ],
      },
    ];

    hiveClient.getAccountHistory.mockResolvedValueOnce(
      hivePage([followOp(4), followOp(1031)]),
    );
    hiveClient.getAccountHistory.mockResolvedValueOnce(hivePage([followOp(3)]));

    const cursor = encodeActivityCursor({ operationIndex: 1032 });
    const result = await endpoint.execute('flowmaster', {
      limit: 2,
      cursor,
      filters: ['followed'],
    });

    expect(result?.items).toHaveLength(2);
    expect(result?.items[0]?.operationIndex).toBe(1031);
    expect(hiveClient.getAccountHistory).toHaveBeenNthCalledWith(
      2,
      'flowmaster',
      4,
      5,
      { filterLow: 1 << 18, filterHigh: 0 },
    );
  });

  it('continues paging when Hive returns assert continueFrom hint', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    const vote = (index: number): HiveAccountHistoryRow => [
      index,
      {
        trx_id: `vote-${index}`,
        block: 1,
        trx_in_block: 0,
        op_in_trx: 0,
        virtual_op: false,
        timestamp: '2024-01-01T00:00:00',
        op: ['vote', { voter: 'alice', author: 'bob', permlink: 'p', weight: 10000 }],
      },
    ];

    hiveClient.getAccountHistory.mockResolvedValueOnce(hivePage([], 500));
    hiveClient.getAccountHistory.mockResolvedValueOnce(hivePage([vote(499), vote(498)]));

    const result = await endpoint.execute('alice', {
      limit: 1,
      filters: ['upvoted'],
    });

    expect(result?.items[0]?.operationIndex).toBe(499);
    expect(hiveClient.getAccountHistory).toHaveBeenNthCalledWith(2, 'alice', 500, 501, {
      filterLow: 1,
      filterHigh: 0,
    });
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
