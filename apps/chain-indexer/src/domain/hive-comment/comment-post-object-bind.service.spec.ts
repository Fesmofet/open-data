import type { CommentOperationPayload } from './hive-comment.schema';
import { CommentPostObjectBindService } from './comment-post-object-bind.service';

function op(partial: Partial<CommentOperationPayload>): CommentOperationPayload {
  return {
    parent_author: 'alice',
    parent_permlink: 'p',
    author: 'bob',
    permlink: 'c',
    title: '',
    body: '',
    json_metadata: '{}',
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

describe('CommentPostObjectBindService', () => {
  it('returns early when thread parent account', async () => {
    const posts = { findByKey: jest.fn(), findPostObjectIdsForPost: jest.fn(), appendPostObjects: jest.fn() };
    const objectsCore = { findObjectTypesByIds: jest.fn() };
    const threads = { findByKey: jest.fn() };
    const postUpsert = { ensureRootPostInDb: jest.fn() };

    const eventEmitter = { emit: jest.fn() };
    const relatedImagesSync = { appendForNewBindings: jest.fn() };
    const db = makeDb();
    const svc = new CommentPostObjectBindService(
      posts as never,
      objectsCore as never,
      threads as never,
      postUpsert as never,
      eventEmitter as never,
      relatedImagesSync as never,
      db as never,
    );

    await svc.tryBindObjectsFromComment(
      op({ parent_author: 'leothreads', parent_permlink: 't', body: '#x' }),
      '2000-01-01T00:00:00',
    );

    expect(posts.findByKey).not.toHaveBeenCalled();
  });

  it('returns early when parent is a thread row', async () => {
    const posts = { findByKey: jest.fn(), findPostObjectIdsForPost: jest.fn(), appendPostObjects: jest.fn() };
    const objectsCore = { findObjectTypesByIds: jest.fn() };
    const threads = { findByKey: jest.fn().mockResolvedValue({ author: 'a', permlink: 'p' }) };
    const postUpsert = { ensureRootPostInDb: jest.fn() };

    const eventEmitter = { emit: jest.fn() };
    const relatedImagesSync = { appendForNewBindings: jest.fn() };
    const db = makeDb();
    const svc = new CommentPostObjectBindService(
      posts as never,
      objectsCore as never,
      threads as never,
      postUpsert as never,
      eventEmitter as never,
      relatedImagesSync as never,
      db as never,
    );

    await svc.tryBindObjectsFromComment(op({ body: '#x' }), '2000-01-01T00:00:00');

    expect(posts.findByKey).not.toHaveBeenCalled();
  });

  it('returns early when body has no candidates', async () => {
    const posts = { findByKey: jest.fn(), findPostObjectIdsForPost: jest.fn(), appendPostObjects: jest.fn() };
    const objectsCore = { findObjectTypesByIds: jest.fn() };
    const threads = { findByKey: jest.fn().mockResolvedValue(undefined) };
    const postUpsert = { ensureRootPostInDb: jest.fn() };

    const eventEmitter = { emit: jest.fn() };
    const relatedImagesSync = { appendForNewBindings: jest.fn() };
    const db = makeDb();
    const svc = new CommentPostObjectBindService(
      posts as never,
      objectsCore as never,
      threads as never,
      postUpsert as never,
      eventEmitter as never,
      relatedImagesSync as never,
      db as never,
    );

    await svc.tryBindObjectsFromComment(op({ body: 'plain' }), '2000-01-01T00:00:00');

    expect(objectsCore.findObjectTypesByIds).not.toHaveBeenCalled();
  });

  it('calls ensureRootPostInDb when parent post is missing and body has candidates', async () => {
    const restoredPost = { author: 'alice', permlink: 'p', json_metadata: '{}' };
    const posts = {
      findByKey: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(restoredPost),
      findPostObjectIdsForPost: jest.fn().mockResolvedValue(new Set<string>()),
      appendPostObjects: jest.fn(),
    };
    const objectsCore = {
      findObjectTypesByIds: jest
        .fn()
        .mockResolvedValue(new Map([['obj1', 'hashtag']])),
    };
    const threads = { findByKey: jest.fn().mockResolvedValue(undefined) };
    const postUpsert = {
      ensureRootPostInDb: jest.fn().mockResolvedValue(restoredPost),
    };

    const eventEmitter = { emit: jest.fn() };
    const relatedImagesSync = { appendForNewBindings: jest.fn() };
    const db = makeDb();
    const svc = new CommentPostObjectBindService(
      posts as never,
      objectsCore as never,
      threads as never,
      postUpsert as never,
      eventEmitter as never,
      relatedImagesSync as never,
      db as never,
    );

    await svc.tryBindObjectsFromComment(op({ body: '#obj1' }), '2026-07-31T12:00:00');

    expect(postUpsert.ensureRootPostInDb).toHaveBeenCalledWith(
      'alice',
      'p',
      '2026-07-31T12:00:00',
    );
  });

  it('appends new post_objects when parent post exists and core has id', async () => {
    const posts = {
      findByKey: jest.fn().mockResolvedValue({ author: 'alice', permlink: 'p', json_metadata: '{}' }),
      findPostObjectIdsForPost: jest.fn().mockResolvedValue(new Set<string>()),
      appendPostObjects: jest.fn(),
    };
    const objectsCore = {
      findObjectTypesByIds: jest
        .fn()
        .mockResolvedValue(new Map([['obj1', 'hashtag']])),
    };
    const threads = { findByKey: jest.fn().mockResolvedValue(undefined) };
    const postUpsert = { ensureRootPostInDb: jest.fn() };

    const eventEmitter = { emit: jest.fn() };
    const relatedImagesSync = { appendForNewBindings: jest.fn() };
    const db = makeDb();
    const svc = new CommentPostObjectBindService(
      posts as never,
      objectsCore as never,
      threads as never,
      postUpsert as never,
      eventEmitter as never,
      relatedImagesSync as never,
      db as never,
    );

    await svc.tryBindObjectsFromComment(op({ body: '#obj1' }), '2000-01-01T00:00:00');

    expect(postUpsert.ensureRootPostInDb).not.toHaveBeenCalled();
    expect(posts.appendPostObjects).toHaveBeenCalledWith(
      [
        {
          author: 'alice',
          permlink: 'p',
          object_id: 'obj1',
          percent: 0,
          object_type: 'hashtag',
        },
      ],
      expect.anything(),
    );
    expect(relatedImagesSync.appendForNewBindings).toHaveBeenCalledWith(
      'alice',
      'p',
      '{}',
      [
        {
          author: 'alice',
          permlink: 'p',
          object_id: 'obj1',
          percent: 0,
          object_type: 'hashtag',
        },
      ],
      expect.anything(),
    );
  });
});
