import { VoteHiveService } from './vote-hive.service';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';

describe('VoteHiveService', () => {
  const context = {
    transaction: { transaction_id: 'trx-1' },
    timestamp: '2026-01-01T00:00:00',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
  } as HiveOperationHandlerContext;

  function createService(mocks: {
    applyChainVoteIfPostExists?: jest.Mock;
    findRootPostByAuthorPermlink?: jest.Mock;
    countOtherActiveUpvotes?: jest.Mock;
    topExistingUpvoteWeights?: jest.Mock;
    subscriptionExists?: jest.Mock;
    emitWithContext?: jest.Mock;
  }) {
    const applyChainVoteIfPostExists =
      mocks.applyChainVoteIfPostExists ??
      jest.fn().mockResolvedValue(true);
    const findRootPostByAuthorPermlink =
      mocks.findRootPostByAuthorPermlink ??
      jest.fn().mockResolvedValue({ title: 'My post', depth: 0 });
    const countOtherActiveUpvotes =
      mocks.countOtherActiveUpvotes ?? jest.fn().mockResolvedValue(0);
    const topExistingUpvoteWeights =
      mocks.topExistingUpvoteWeights ?? jest.fn().mockResolvedValue([]);
    const subscriptionExists =
      mocks.subscriptionExists ?? jest.fn().mockResolvedValue(false);
    const emitWithContext = mocks.emitWithContext ?? jest.fn();

    const db = {
      transaction: jest.fn(() => ({
        execute: (fn: (trx: unknown) => Promise<void>) => fn({}),
      })),
    };

    return {
      service: new VoteHiveService(
        db as never,
        {
          applyChainVoteIfPostExists,
          findRootPostByAuthorPermlink,
          countOtherActiveUpvotes,
          topExistingUpvoteWeights,
          findByKey: jest.fn(),
        } as never,
        { enqueue: jest.fn() } as never,
        { markDirty: jest.fn() } as never,
        { subscriptionExists } as never,
        { hiveContext: jest.fn().mockReturnValue({}), emitWithContext } as never,
      ),
      emitWithContext,
      applyChainVoteIfPostExists,
      findRootPostByAuthorPermlink,
      countOtherActiveUpvotes,
      topExistingUpvoteWeights,
      subscriptionExists,
    };
  }

  it('emits enriched vote_like when policy allows', async () => {
    const { service, emitWithContext } = createService({});
    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 10_000 },
      context,
    );

    expect(emitWithContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'vote_like',
        payload: {
          voter: 'voter1',
          author: 'author1',
          permlink: 'p1',
          weight: 10_000,
          title: 'My post',
          likesCount: 0,
        },
      }),
    );
  });

  it('skips vote_like for unvotes and unknown posts', async () => {
    const emitWithContext = jest.fn();
    const { service } = createService({
      applyChainVoteIfPostExists: jest.fn().mockResolvedValue(false),
      findRootPostByAuthorPermlink: jest.fn().mockResolvedValue(undefined),
      emitWithContext,
    });

    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 0 },
      context,
    );
    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 10_000 },
      context,
    );

    expect(emitWithContext).not.toHaveBeenCalled();
  });

  it('skips vote_like when target is not a root post', async () => {
    const emitWithContext = jest.fn();
    const { service, findRootPostByAuthorPermlink } = createService({
      findRootPostByAuthorPermlink: jest.fn().mockResolvedValue(undefined),
      emitWithContext,
    });

    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 10_000 },
      context,
    );

    expect(findRootPostByAuthorPermlink).toHaveBeenCalledWith('author1', 'p1');
    expect(emitWithContext).not.toHaveBeenCalled();
  });

  it('emits vote_downvote without like enrichment', async () => {
    const { service, emitWithContext } = createService({});
    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: -5_000 },
      context,
    );

    expect(emitWithContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'vote_downvote',
        payload: {
          voter: 'voter1',
          author: 'author1',
          permlink: 'p1',
          weight: -5_000,
        },
      }),
    );
  });

  it('suppresses low-weight vote_like when policy rejects', async () => {
    const emitWithContext = jest.fn();
    const { service, subscriptionExists, topExistingUpvoteWeights } =
      createService({
        countOtherActiveUpvotes: jest.fn().mockResolvedValue(6),
        topExistingUpvoteWeights: jest
          .fn()
          .mockResolvedValue([50_000, 40_000, 30_000]),
        emitWithContext,
      });

    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 1_000 },
      context,
    );

    expect(subscriptionExists).toHaveBeenCalledWith('author1', 'voter1');
    expect(topExistingUpvoteWeights).toHaveBeenCalledWith(
      'author1',
      'p1',
      'voter1',
      3,
    );
    expect(emitWithContext).not.toHaveBeenCalled();
  });

  it('does not query follow graph when likesCount is at most five', async () => {
    const { service, subscriptionExists, topExistingUpvoteWeights } =
      createService({
        countOtherActiveUpvotes: jest.fn().mockResolvedValue(5),
      });

    await service.handleVote(
      { voter: 'voter1', author: 'author1', permlink: 'p1', weight: 10_000 },
      context,
    );

    expect(subscriptionExists).not.toHaveBeenCalled();
    expect(topExistingUpvoteWeights).not.toHaveBeenCalled();
  });
});
