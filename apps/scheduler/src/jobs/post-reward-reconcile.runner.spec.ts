import { PostRewardReconcileRunner } from './post-reward-reconcile.runner';
import type { JobHandlerContext } from './cron-job.types';

function makeCtx(signal: AbortSignal): JobHandlerContext {
  return {
    jobName: 'waiv-post-reconcile',
    runId: 'run-1',
    attempt: 1,
    payload: null,
    signal,
  };
}

describe('PostRewardReconcileRunner', () => {
  function makeRunner(
    overrides: Partial<{
      batchSize: number;
      dirty: Array<{ author: string; permlink: string }>;
    }> = {},
  ): PostRewardReconcileRunner {
    const batchSize = overrides.batchSize ?? 25;
    const runner = Object.create(
      PostRewardReconcileRunner.prototype,
    ) as PostRewardReconcileRunner;
    const claimNewest = jest
      .fn()
      .mockResolvedValue(overrides.dirty ?? []);
    const touchDirty = jest.fn().mockResolvedValue(undefined);
    Object.assign(runner, {
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
      configService: {
        get: jest.fn((key: string, def: number) => {
          if (key === 'postRewardReconcile.batchSize') {
            return batchSize;
          }
          return def;
        }),
      },
      reconcileQueue: { claimNewest, touchDirty, remove: jest.fn() },
      reconcilePost: jest.fn().mockResolvedValue(undefined),
    });
    return runner;
  }

  it('returns immediately when aborted', async () => {
    const runner = makeRunner();
    const controller = new AbortController();
    controller.abort();

    await runner.run(makeCtx(controller.signal));

    expect(
      (runner as unknown as { reconcileQueue: { claimNewest: jest.Mock } })
        .reconcileQueue.claimNewest,
    ).not.toHaveBeenCalled();
  });

  it('claims dirty posts using batch size from config', async () => {
    const runner = makeRunner({ batchSize: 25 });

    await runner.run(makeCtx(new AbortController().signal));

    expect(
      (runner as unknown as { reconcileQueue: { claimNewest: jest.Mock } })
        .reconcileQueue.claimNewest,
    ).toHaveBeenCalledWith(25);
  });

  it('reconciles each unique dirty post once', async () => {
    const runner = makeRunner({
      dirty: [
        { author: 'alice', permlink: 'p1' },
        { author: 'alice', permlink: 'p1' },
        { author: 'bob', permlink: 'p2' },
      ],
    });

    await runner.run(makeCtx(new AbortController().signal));

    const reconcilePost = (runner as unknown as { reconcilePost: jest.Mock })
      .reconcilePost;
    expect(reconcilePost).toHaveBeenCalledTimes(2);
    expect(reconcilePost).toHaveBeenCalledWith('alice', 'p1');
    expect(reconcilePost).toHaveBeenCalledWith('bob', 'p2');
  });

  it('re-touches dirty queue entry when reconcile fails', async () => {
    const runner = makeRunner({
      dirty: [{ author: 'alice', permlink: 'p1' }],
    });
    (runner as unknown as { reconcilePost: jest.Mock }).reconcilePost.mockRejectedValue(
      new Error('hive down'),
    );

    await runner.run(makeCtx(new AbortController().signal));

    expect(
      (runner as unknown as { reconcileQueue: { touchDirty: jest.Mock } })
        .reconcileQueue.touchDirty,
    ).toHaveBeenCalledWith('alice', 'p1');
  });

  it('stops mid-batch when aborted', async () => {
    const runner = makeRunner({
      dirty: [
        { author: 'alice', permlink: 'p1' },
        { author: 'bob', permlink: 'p2' },
      ],
    });
    const controller = new AbortController();
    (runner as unknown as { reconcilePost: jest.Mock }).reconcilePost.mockImplementation(
      async () => {
        controller.abort();
      },
    );

    await runner.run(makeCtx(controller.signal));

    expect(
      (runner as unknown as { reconcilePost: jest.Mock }).reconcilePost,
    ).toHaveBeenCalledTimes(1);
  });
});
