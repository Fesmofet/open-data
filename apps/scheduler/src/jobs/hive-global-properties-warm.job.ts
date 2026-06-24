import { Logger } from '@nestjs/common';
import type { CronJobDefinition } from './cron-job.types';
import { getHiveGlobalPropertiesWarmRunner } from './hive-global-properties-warm.runner';

const logger = new Logger('hive-global-properties-warm');

/**
 * Warms query-api's Hive dynamic-global-properties cache every ~5 minutes so the
 * read path never pays a cold live RPC. query-api keeps a lazy RPC fallback.
 */
export const hiveGlobalPropertiesWarmJob: CronJobDefinition = {
  name: 'hive-global-properties-warm',
  schedule: '*/5 * * * *',
  category: 'light',
  enabled: true,
  timeoutMs: 30_000,
  lockTtlSec: 30,
  retryCount: 1,
  retryDelayMs: 10_000,
  allowOverlap: false,
  run: async (ctx) => {
    logger.log(`run ${ctx.runId} attempt ${ctx.attempt}`);
    await getHiveGlobalPropertiesWarmRunner().run(ctx);
  },
};
