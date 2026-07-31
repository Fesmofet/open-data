import { UpdatesFeedRepository } from './updates-feed.repository';

function mockKyselyJoinRow(result: unknown) {
  const executeTakeFirst = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ executeTakeFirst });
  const chain: {
    leftJoin: jest.Mock;
    where: jest.Mock;
    selectAll: jest.Mock;
    select: jest.Mock;
  } = {
    leftJoin: jest.fn(),
    where: jest.fn(),
    selectAll: jest.fn(),
    select,
  };
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.selectAll.mockReturnValue(chain);
  const selectFrom = jest.fn().mockReturnValue(chain);
  return {
    db: { selectFrom } as never,
    executeTakeFirst,
  };
}

describe('UpdatesFeedRepository.findJoinRowByObjectAndUpdateId', () => {
  it('returns null when no row matches', async () => {
    const { db } = mockKyselyJoinRow(undefined);
    const repo = new UpdatesFeedRepository(db);

    await expect(
      repo.findJoinRowByObjectAndUpdateId('obj1', 'missing'),
    ).resolves.toBeNull();
  });

  it('maps join row when update exists', async () => {
    const { db } = mockKyselyJoinRow({
      update_id: 'u1',
      object_id: 'obj1',
      update_type: 'name',
      creator: 'alice',
      locale: null,
      created_at_unix: 100,
      value_text: 'Shop',
      value_json: null,
      value_geo: null,
      rank_score: null,
      rank_context: null,
      rank_decisive_event_seq: null,
      search_vector: null,
      value_text_normalized: null,
      transaction_id: 'tx1',
      event_seq: BigInt(1),
      creator_wobjects_weight: 5,
      geo_lat: null,
      geo_lon: null,
    });
    const repo = new UpdatesFeedRepository(db);

    const row = await repo.findJoinRowByObjectAndUpdateId('obj1', 'u1');

    expect(row).toEqual({
      row: expect.objectContaining({
        update_id: 'u1',
        object_id: 'obj1',
        update_type: 'name',
      }),
      creator_wobjects_weight: 5,
      geo_lat: null,
      geo_lon: null,
    });
  });

  it('returns null on SQL failure', async () => {
    const executeTakeFirst = jest.fn().mockRejectedValue(new Error('db down'));
    const select = jest.fn().mockReturnValue({ executeTakeFirst });
    const chain: {
      leftJoin: jest.Mock;
      where: jest.Mock;
      selectAll: jest.Mock;
      select: jest.Mock;
    } = {
      leftJoin: jest.fn(),
      where: jest.fn(),
      selectAll: jest.fn(),
      select,
    };
    chain.leftJoin.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.selectAll.mockReturnValue(chain);
    const db = { selectFrom: jest.fn().mockReturnValue(chain) } as never;
    const repo = new UpdatesFeedRepository(db);

    await expect(
      repo.findJoinRowByObjectAndUpdateId('obj1', 'u1'),
    ).resolves.toBeNull();
  });
});
