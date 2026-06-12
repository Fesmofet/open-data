import { PostRewardsFinalizeRunner } from './post-rewards-finalize.runner';
import type { JobHandlerContext } from './cron-job.types';

function makeCtx(signal: AbortSignal): JobHandlerContext {
  return {
    jobName: 'post-rewards-finalize',
    runId: 'run-1',
    attempt: 1,
    payload: null,
    signal,
  };
}

describe('PostRewardsFinalizeRunner', () => {
  function makeRunner(
    overrides: Partial<{
      batchSize: number;
      delaySec: number;
      fromQueue: Array<{ author: string; permlink: string }>;
      fromPg: Array<{ author: string; permlink: string }>;
    }> = {},
  ): PostRewardsFinalizeRunner {
    const batchSize = overrides.batchSize ?? 30;
    const delaySec = overrides.delaySec ?? 900;
    const runner = Object.create(
      PostRewardsFinalizeRunner.prototype,
    ) as PostRewardsFinalizeRunner;
    const claimDue = jest
      .fn()
      .mockResolvedValue(overrides.fromQueue ?? []);
    const findRootPostsPendingRewardsFinalize = jest
      .fn()
      .mockResolvedValue(overrides.fromPg ?? []);
    Object.assign(runner, {
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
      configService: {
        get: jest.fn((key: string, def: number) => {
          if (key === 'postRewardsFinalize.batchSize') {
            return batchSize;
          }
          if (key === 'postRewardsFinalize.delaySec') {
            return delaySec;
          }
          return def;
        }),
      },
      finalizeQueue: { claimDue, remove: jest.fn() },
      postsRepository: { findRootPostsPendingRewardsFinalize },
      hiveClient: {},
      historyClient: {},
      finalizePost: jest.fn().mockResolvedValue(true),
    });
    return runner;
  }

  it('returns immediately when aborted', async () => {
    const runner = makeRunner();
    const controller = new AbortController();
    controller.abort();

    await runner.run(makeCtx(controller.signal));

    expect(
      (runner as unknown as { finalizeQueue: { claimDue: jest.Mock } })
        .finalizeQueue.claimDue,
    ).not.toHaveBeenCalled();
  });

  it('claims due queue members using batch size from config', async () => {
    const runner = makeRunner({ batchSize: 30 });
    const nowSec = Math.floor(Date.now() / 1000);

    await runner.run(makeCtx(new AbortController().signal));

    expect(
      (runner as unknown as { finalizeQueue: { claimDue: jest.Mock } })
        .finalizeQueue.claimDue,
    ).toHaveBeenCalledWith(nowSec, 30);
  });

  it('fills remaining batch slots from PG safety net', async () => {
    const runner = makeRunner({
      batchSize: 5,
      fromQueue: [
        { author: 'alice', permlink: 'p1' },
        { author: 'bob', permlink: 'p2' },
      ],
      fromPg: [{ author: 'carol', permlink: 'p3' }],
    });

    await runner.run(makeCtx(new AbortController().signal));

    const postsRepository = (
      runner as unknown as {
        postsRepository: { findRootPostsPendingRewardsFinalize: jest.Mock };
      }
    ).postsRepository;
    const finalizePost = (runner as unknown as { finalizePost: jest.Mock })
      .finalizePost;

    expect(postsRepository.findRootPostsPendingRewardsFinalize).toHaveBeenCalledWith(
      3,
      900,
    );
    expect(finalizePost).toHaveBeenCalledTimes(3);
  });

  it('deduplicates queue and PG targets', async () => {
    const runner = makeRunner({
      batchSize: 5,
      fromQueue: [{ author: 'alice', permlink: 'p1' }],
      fromPg: [{ author: 'alice', permlink: 'p1' }],
    });

    await runner.run(makeCtx(new AbortController().signal));

    const finalizePost = (runner as unknown as { finalizePost: jest.Mock })
      .finalizePost;
    expect(finalizePost).toHaveBeenCalledTimes(1);
    expect(finalizePost).toHaveBeenCalledWith(
      'alice',
      'p1',
      expect.any(Number),
    );
  });

  it('stops mid-batch when aborted', async () => {
    const runner = makeRunner({
      fromQueue: [
        { author: 'alice', permlink: 'p1' },
        { author: 'bob', permlink: 'p2' },
      ],
    });
    const controller = new AbortController();
    (runner as unknown as { finalizePost: jest.Mock }).finalizePost.mockImplementation(
      async () => {
        controller.abort();
        return true;
      },
    );

    await runner.run(makeCtx(controller.signal));

    expect(
      (runner as unknown as { finalizePost: jest.Mock }).finalizePost,
    ).toHaveBeenCalledTimes(1);
  });
});
