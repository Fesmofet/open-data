jest.mock('./post-languages', () => ({
  detectPostLanguagesBcp47: jest.fn().mockResolvedValue([]),
}));

import type { HiveContentType } from '@opden-data-layer/clients';
import {
  blockTimestampToUnixSeconds,
  cashoutTimeFromBlock,
  parseCashoutToUnix,
} from '@opden-data-layer/core';
import type { CommentOperationPayload } from './hive-comment.schema';
import { PostUpsertService } from './post-upsert.service';

const RECOVERY_BLOCK_TS = '2026-07-31T12:00:00';
const HIVE_CREATED = '2025-01-15T08:30:00';
const HIVE_CASHOUT = '2025-01-22T08:30:00';

function op(partial: Partial<CommentOperationPayload> = {}): CommentOperationPayload {
  return {
    parent_author: '',
    parent_permlink: 'blog',
    author: 'alice',
    permlink: 'post-1',
    title: 'Title',
    body: 'Body',
    json_metadata: '{}',
    ...partial,
  };
}

function hiveContent(partial: Partial<HiveContentType> = {}): HiveContentType {
  return {
    id: 1,
    author: 'alice',
    permlink: 'post-1',
    parent_author: '',
    parent_permlink: 'blog',
    root_author: 'alice',
    root_permlink: 'post-1',
    title: 'Title',
    body: 'Body',
    json_metadata: '{}',
    app: 'waivio',
    depth: '0',
    total_vote_weight: 100,
    language: 'en',
    author_weight: 1,
    reblog_to: { author: '', permlink: '' },
    category: 'blog',
    created: HIVE_CREATED,
    last_update: HIVE_CREATED,
    last_payout: '1970-01-01T00:00:00',
    cashout_time: HIVE_CASHOUT,
    total_payout_value: '1.000 HBD',
    curator_payout_value: '0.500 HBD',
    pending_payout_value: '0.000 HBD',
    max_accepted_payout: '1000000.000 HBD',
    active: HIVE_CREATED,
    url: '/blog/@alice/post-1',
    max_cashout_time: HIVE_CASHOUT,
    root_title: 'Title',
    promoted: '0.000 HBD',
    total_pending_payout_value: '0.000 HBD',
    children: 3,
    body_length: 4,
    author_reputation: 50,
    percent_hbd: 10000,
    author_rewards: 500,
    reward_weight: 10000,
    reblogged_by: [],
    net_votes: 2,
    children_abs_rshares: 0,
    vote_rshares: 1000,
    net_rshares: 1000,
    abs_rshares: 1000,
    allow_votes: true,
    allow_curation_rewards: true,
    allow_replies: true,
    beneficiaries: [],
    blocked_for_apps: [],
    reblogged_users: [],
    active_votes: [
      { voter: 'bob', weight: 10000, percent: 10000, reputation: 25, rshares: 1000 },
    ],
    ...partial,
  };
}

function makeDb() {
  return {
    transaction: jest.fn().mockReturnValue({
      execute: jest.fn(async (fn: (trx: object) => Promise<void>) => fn({})),
    }),
  };
}

function buildService(overrides: {
  findByKey?: jest.Mock;
  upsertPostWithSatellitesTrx?: jest.Mock;
  getContent?: jest.Mock;
  schedule?: jest.Mock;
} = {}) {
  const findByKey =
    overrides.findByKey ?? jest.fn().mockResolvedValue(undefined);
  const upsertPostWithSatellitesTrx =
    overrides.upsertPostWithSatellitesTrx ?? jest.fn().mockResolvedValue(undefined);
  const getContent =
    overrides.getContent ?? jest.fn().mockResolvedValue(hiveContent());
  const schedule = overrides.schedule ?? jest.fn().mockResolvedValue(undefined);

  const service = new PostUpsertService(
    {
      findByKey,
      upsertPostWithSatellitesTrx,
      findActiveVotes: jest.fn().mockResolvedValue([]),
    } as never,
    {
      findObjectTypesByIds: jest.fn().mockResolvedValue(new Map()),
    } as never,
    { getContent } as never,
    {
      resolvePlatform: jest.fn().mockResolvedValue({ muted: [] }),
    } as never,
    { emit: jest.fn() } as never,
    { schedule } as never,
    {
      get: jest.fn().mockReturnValue(900),
    } as never,
    {
      syncForPost: jest.fn().mockResolvedValue(undefined),
    } as never,
    makeDb() as never,
  );

  return { service, findByKey, upsertPostWithSatellitesTrx, getContent, schedule };
}

describe('PostUpsertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertRootPost live create', () => {
    it('uses blockTimestamp for created and cashout_time when no hive snapshot', async () => {
      const { service, upsertPostWithSatellitesTrx } = buildService();

      await service.upsertRootPost(op(), {}, RECOVERY_BLOCK_TS);

      expect(upsertPostWithSatellitesTrx).toHaveBeenCalledTimes(1);
      const row = upsertPostWithSatellitesTrx.mock.calls[0][1];
      expect(row.created).toBe('2026-07-31T12:00:00');
      expect(row.created_unix).toBe(blockTimestampToUnixSeconds(RECOVERY_BLOCK_TS));
      expect(row.cashout_time).toBe(cashoutTimeFromBlock(RECOVERY_BLOCK_TS));
    });
  });

  describe('upsertRootPost recovery create', () => {
    it('uses hive created and cashout_time instead of recovery block timestamp', async () => {
      const hive = hiveContent();
      const { service, upsertPostWithSatellitesTrx, schedule } = buildService();

      await service.upsertRootPost(op(), {}, RECOVERY_BLOCK_TS, hive);

      expect(upsertPostWithSatellitesTrx).toHaveBeenCalledTimes(1);
      const row = upsertPostWithSatellitesTrx.mock.calls[0][1];
      expect(row.created).toBe(HIVE_CREATED);
      expect(row.created_unix).toBe(blockTimestampToUnixSeconds(HIVE_CREATED));
      expect(row.cashout_time).toBe(HIVE_CASHOUT);
      expect(row.net_rshares).toBe(BigInt(1000));
      expect(row.children).toBe(3);

      const satellites = upsertPostWithSatellitesTrx.mock.calls[0][2];
      expect(satellites.votes).toEqual([
        expect.objectContaining({
          voter: 'bob',
          rshares: BigInt(1000),
        }),
      ]);

      const cashoutUnix = parseCashoutToUnix(HIVE_CASHOUT);
      expect(schedule).toHaveBeenCalledWith('alice', 'post-1', cashoutUnix! + 900);
    });
  });

  describe('ensureRootPostInDb', () => {
    it('restores missing root post with hive timestamps', async () => {
      const restoredPost = { author: 'alice', permlink: 'post-1' };
      const upsertPostWithSatellitesTrx = jest.fn().mockResolvedValue(undefined);
      const findByKey = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(restoredPost);
      const getContent = jest.fn().mockResolvedValue(hiveContent());
      const { service } = buildService({
        findByKey,
        upsertPostWithSatellitesTrx,
        getContent,
      });

      const result = await service.ensureRootPostInDb(
        'alice',
        'post-1',
        RECOVERY_BLOCK_TS,
      );

      expect(getContent).toHaveBeenCalledWith('alice', 'post-1');
      expect(upsertPostWithSatellitesTrx).toHaveBeenCalledTimes(1);
      const row = upsertPostWithSatellitesTrx.mock.calls[0][1];
      expect(row.created).toBe(HIVE_CREATED);
      expect(row.cashout_time).toBe(HIVE_CASHOUT);
      expect(result).toEqual(restoredPost);
    });

    it('returns existing post without calling getContent', async () => {
      const existing = { author: 'alice', permlink: 'post-1' };
      const getContent = jest.fn();
      const { service } = buildService({
        findByKey: jest.fn().mockResolvedValue(existing),
        getContent,
      });

      const result = await service.ensureRootPostInDb(
        'alice',
        'post-1',
        RECOVERY_BLOCK_TS,
      );

      expect(getContent).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('returns undefined when hive content is a comment', async () => {
      const upsertPostWithSatellitesTrx = jest.fn();
      const { service } = buildService({
        getContent: jest.fn().mockResolvedValue(hiveContent({ depth: '1' })),
        upsertPostWithSatellitesTrx,
      });

      const result = await service.ensureRootPostInDb(
        'alice',
        'post-1',
        RECOVERY_BLOCK_TS,
      );

      expect(result).toBeUndefined();
      expect(upsertPostWithSatellitesTrx).not.toHaveBeenCalled();
    });

    it('returns undefined when hive has no content', async () => {
      const upsertPostWithSatellitesTrx = jest.fn();
      const { service } = buildService({
        getContent: jest.fn().mockResolvedValue(undefined),
        upsertPostWithSatellitesTrx,
      });

      const result = await service.ensureRootPostInDb(
        'alice',
        'post-1',
        RECOVERY_BLOCK_TS,
      );

      expect(result).toBeUndefined();
      expect(upsertPostWithSatellitesTrx).not.toHaveBeenCalled();
    });
  });
});
