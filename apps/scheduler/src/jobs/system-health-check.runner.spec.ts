import { SystemHealthCheckRunner } from './system-health-check.runner';
import { SystemHealthCheckService } from '@opden-data-layer/system-alerts';

describe('SystemHealthCheckRunner', () => {
  it('publishes when warnings exist', async () => {
    const health = {
      check: jest.fn().mockResolvedValue({
        checkedAt: 't',
        ok: [],
        warnings: [
          {
            label: 'hive',
            redisKey: 'k',
            actualBlock: 1,
            headBlock: 100,
            lagBlocks: 99,
            ok: false,
          },
        ],
      }),
    } as unknown as SystemHealthCheckService;
    const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
    const runner = new SystemHealthCheckRunner(health, publisher as never);
    await runner.run({
      jobName: 'system-health-check',
      runId: '1',
      attempt: 1,
      payload: null,
      signal: new AbortController().signal,
    });
    expect(publisher.publish).toHaveBeenCalledTimes(1);
  });

  it('skips publish when healthy', async () => {
    const health = {
      check: jest.fn().mockResolvedValue({
        checkedAt: 't',
        ok: [{ label: 'x', redisKey: 'k', actualBlock: 1, headBlock: 1, lagBlocks: 0, ok: true }],
        warnings: [],
      }),
    } as unknown as SystemHealthCheckService;
    const publisher = { publish: jest.fn() };
    const runner = new SystemHealthCheckRunner(health, publisher as never);
    await runner.run({
      jobName: 'system-health-check',
      runId: '1',
      attempt: 1,
      payload: null,
      signal: new AbortController().signal,
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
