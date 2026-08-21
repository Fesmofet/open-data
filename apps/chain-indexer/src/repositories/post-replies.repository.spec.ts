import { PostRepliesRepository } from './post-replies.repository';

type MockQueryResult = Record<string, unknown> | undefined;

function makeMockDb(handlers: {
  postsByKey: Map<string, MockQueryResult>;
  postRepliesByKey: Map<string, MockQueryResult>;
  postsRootByKey: Map<string, MockQueryResult>;
  upsertExecute?: jest.Mock;
}) {
  const upsertExecute = handlers.upsertExecute ?? jest.fn().mockResolvedValue(undefined);

  const selectFrom = jest.fn((table: string) => {
    const state: { table: string; author?: string; permlink?: string } = {
      table,
    };

    const executeTakeFirst = async () => {
      const key = `${state.author}/${state.permlink}`;
      if (state.table === 'posts') {
        const direct = handlers.postsByKey.get(key);
        if (direct !== undefined) {
          return direct;
        }
        return handlers.postsRootByKey.get(key);
      }
      if (state.table === 'post_replies') {
        return handlers.postRepliesByKey.get(key);
      }
      return undefined;
    };

    const whereChain = {
      where: (col: string, _op: string, val: string | ((eb: unknown) => unknown)) => {
        if (typeof val === 'function') {
          val({});
          return { executeTakeFirst };
        }
        if (col === 'author') {
          state.author = val as string;
        }
        if (col === 'permlink') {
          state.permlink = val as string;
        }
        return whereChain;
      },
      executeTakeFirst,
    };

    return {
      select: () => whereChain,
    };
  });

  const insertInto = jest.fn(() => ({
    values: () => ({
      onConflict: () => ({
        doUpdateSet: () => ({
          execute: upsertExecute,
        }),
        doNothing: () => ({
          execute: upsertExecute,
        }),
        execute: upsertExecute,
      }),
    }),
  }));

  return {
    db: { selectFrom, insertInto } as never,
    upsertExecute,
  };
}

describe('PostRepliesRepository.resolveRoot', () => {
  it('returns root from parent post row', async () => {
    const postsByKey = new Map([
      [
        'bob/comment-1',
        { root_author: 'alice', root_permlink: 'root-post' },
      ],
    ]);
    const { db } = makeMockDb({
      postsByKey,
      postRepliesByKey: new Map(),
      postsRootByKey: new Map(),
    });
    const repo = new PostRepliesRepository(db);

    await expect(repo.resolveRoot('bob', 'comment-1')).resolves.toEqual({
      root_author: 'alice',
      root_permlink: 'root-post',
    });
  });

  it('returns root from post_replies when parent is not in posts', async () => {
    const postRepliesByKey = new Map([
      [
        'bob/comment-1',
        { root_author: 'alice', root_permlink: 'root-post' },
      ],
    ]);
    const { db } = makeMockDb({
      postsByKey: new Map(),
      postRepliesByKey,
      postsRootByKey: new Map(),
    });
    const repo = new PostRepliesRepository(db);

    await expect(repo.resolveRoot('bob', 'comment-1')).resolves.toEqual({
      root_author: 'alice',
      root_permlink: 'root-post',
    });
  });

  it('returns parent as root when parent is a root post', async () => {
    const postsRootByKey = new Map([['alice/root-post', { author: 'alice', permlink: 'root-post' }]]);
    const { db } = makeMockDb({
      postsByKey: new Map(),
      postRepliesByKey: new Map(),
      postsRootByKey,
    });
    const repo = new PostRepliesRepository(db);

    await expect(repo.resolveRoot('alice', 'root-post')).resolves.toEqual({
      root_author: 'alice',
      root_permlink: 'root-post',
    });
  });

  it('returns null when root cannot be resolved', async () => {
    const { db } = makeMockDb({
      postsByKey: new Map(),
      postRepliesByKey: new Map(),
      postsRootByKey: new Map(),
    });
    const repo = new PostRepliesRepository(db);

    await expect(repo.resolveRoot('missing', 'post')).resolves.toBeNull();
  });

  it('returns null on database read error', async () => {
    const db = {
      selectFrom: () => ({
        select: () => ({
          where: () => ({
            where: () => ({
              executeTakeFirst: async () => {
                throw new Error('db down');
              },
            }),
          }),
        }),
      }),
    };
    const repo = new PostRepliesRepository(db as never);

    await expect(repo.resolveRoot('alice', 'p')).resolves.toBeNull();
  });
});

describe('PostRepliesRepository.upsertReply', () => {
  it('executes idempotent upsert', async () => {
    const upsertExecute = jest.fn().mockResolvedValue(undefined);
    const { db } = makeMockDb({
      postsByKey: new Map(),
      postRepliesByKey: new Map(),
      postsRootByKey: new Map(),
      upsertExecute,
    });
    const repo = new PostRepliesRepository(db);

    await repo.upsertReply({
      author: 'bob',
      permlink: 'reply-1',
      root_author: 'alice',
      root_permlink: 'root-post',
      parent_author: 'alice',
      parent_permlink: 'root-post',
      created_unix: 1_700_000_000,
    });

    expect(upsertExecute).toHaveBeenCalledTimes(1);
  });

  it('rethrows on write error', async () => {
    const upsertExecute = jest.fn().mockRejectedValue(new Error('write failed'));
    const { db } = makeMockDb({
      postsByKey: new Map(),
      postRepliesByKey: new Map(),
      postsRootByKey: new Map(),
      upsertExecute,
    });
    const repo = new PostRepliesRepository(db);

    await expect(
      repo.upsertReply({
        author: 'bob',
        permlink: 'reply-1',
        root_author: 'alice',
        root_permlink: 'root-post',
        parent_author: 'alice',
        parent_permlink: 'root-post',
        created_unix: 1_700_000_000,
      }),
    ).rejects.toThrow('write failed');
  });
});
