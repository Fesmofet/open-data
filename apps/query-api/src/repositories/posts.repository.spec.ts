import { PostsRepository } from './posts.repository';

function createFindHomeFeedDbMock(
  executeResult: Array<{
    author: string;
    permlink: string;
    feed_at: number;
    reblogged_by: null;
  }> = [],
) {
  const where = jest.fn();
  const chain: {
    where: jest.Mock;
    select: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
  } = {
    where,
    select: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  };
  chain.where.mockImplementation(() => chain);
  chain.select.mockImplementation(() => chain);
  chain.orderBy.mockImplementation(() => chain);
  chain.limit.mockReturnValue({
    execute: jest.fn().mockResolvedValue(executeResult),
  });
  const db = {
    selectFrom: jest.fn().mockReturnValue(chain),
  };
  return { db: db as never, where, chain };
}

describe('PostsRepository.findUserBlogObjectFacets', () => {
  it('returns empty array on SQL failure', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('db down'));
    const db = {
      execute,
      getExecutor: () => ({ execute }),
    } as never;
    const repo = new PostsRepository(db);

    const rows = await repo.findUserBlogObjectFacets('alice', ['obj-1']);

    expect(rows).toEqual([]);
  });
});

describe('PostsRepository.findHomeFeed', () => {
  it('returns empty array on SQL failure', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('db down'));
    const db = {
      selectFrom: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ execute }),
    } as never;
    const repo = new PostsRepository(db);

    const rows = await repo.findHomeFeed(undefined, [], null, 21);

    expect(rows).toEqual([]);
  });

  it('applies only root predicate for guest feed', async () => {
    const { db, where } = createFindHomeFeedDbMock([
      { author: 'alice', permlink: 'p1', feed_at: 100, reblogged_by: null },
    ]);
    const repo = new PostsRepository(db);

    const rows = await repo.findHomeFeed(undefined, [], null, 21);

    expect(rows).toEqual([
      {
        author: 'alice',
        permlink: 'p1',
        feed_at: 100,
        reblogged_by: null,
      },
    ]);
    expect(where).toHaveBeenCalledTimes(1);
    expect(typeof where.mock.calls[0]?.[0]).not.toBe('function');
  });

  it('adds personalized OR filter for logged-in viewer', async () => {
    const { db, where } = createFindHomeFeedDbMock();
    const repo = new PostsRepository(db);

    await repo.findHomeFeed('alice', [], null, 21);

    expect(where).toHaveBeenCalledTimes(2);
    expect(typeof where.mock.calls[1]?.[0]).toBe('function');
  });

  it('excludes muted authors for logged-in viewer', async () => {
    const { db, where } = createFindHomeFeedDbMock();
    const repo = new PostsRepository(db);

    await repo.findHomeFeed('alice', ['bob'], null, 21);

    expect(where).toHaveBeenCalledTimes(3);
    expect(where).toHaveBeenCalledWith('p.author', 'not in', ['bob']);
    expect(typeof where.mock.calls[2]?.[0]).toBe('function');
  });
});
