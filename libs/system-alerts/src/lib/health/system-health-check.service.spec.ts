import { DEFAULT_BLOCK_LAG_BUFFER } from './block-cursor-check';
import { SystemHealthCheckService } from './system-health-check.service';

describe('SystemHealthCheckService', () => {
  const check = {
    label: 'test hive',
    redisKey: 'chain-indexer:cache:hive:block-number',
    chain: 'hive' as const,
  };

  function createService(overrides: {
    headHive?: number | null;
    headEngine?: number | null;
    redisGet?: (key: string) => Promise<string | null>;
  }): SystemHealthCheckService {
    const hiveClient = {
      getDynamicGlobalProperties: jest.fn().mockResolvedValue(
        overrides.headHive === null || overrides.headHive === undefined
          ? undefined
          : { head_block_number: overrides.headHive },
      ),
    };
    const hiveEngineClient = {
      getStatus: jest.fn().mockResolvedValue(
        overrides.headEngine === null || overrides.headEngine === undefined
          ? undefined
          : { lastBlockNumber: overrides.headEngine },
      ),
    };
    const redisGet =
      overrides.redisGet ?? jest.fn().mockResolvedValue('1000');
    const redisFactory = {
      getClient: () => ({ get: redisGet }),
    };
    return new SystemHealthCheckService(
      { checks: [check], lagBuffer: DEFAULT_BLOCK_LAG_BUFFER },
      redisFactory as never,
      hiveClient as never,
      hiveEngineClient as never,
    );
  }

  it('reports ok when cursor is within buffer', async () => {
    const service = createService({ headHive: 1050, redisGet: async () => '1000' });
    const report = await service.check();
    expect(report.ok).toHaveLength(1);
    expect(report.warnings).toHaveLength(0);
  });

  it('reports warning when lag exceeds buffer', async () => {
    const service = createService({ headHive: 1200, redisGet: async () => '1000' });
    const report = await service.check();
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]?.ok).toBe(false);
  });

  it('reports warning when head block unavailable', async () => {
    const service = createService({ headHive: null });
    const report = await service.check();
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]?.detail).toContain('head');
  });

  it('reports warning when redis cursor missing', async () => {
    const service = createService({
      headHive: 1000,
      redisGet: async () => null,
    });
    const report = await service.check();
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]?.detail).toContain('Redis');
  });
});
