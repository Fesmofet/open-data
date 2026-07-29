import { Logger } from '@nestjs/common';
import type { CronJobDefinition } from './cron-job.types';
import { getSystemHealthCheckRunner } from './system-health-check.runner';

const logger = new Logger('system-health-check');

export const systemHealthCheckJob: CronJobDefinition = {
  name: 'system-health-check',
  schedule: '*/30 * * * *',
  category: 'light',
  enabled: true,
  timeoutMs: 60_000,
  lockTtlSec: 60,
  retryCount: 1,
  retryDelayMs: 10_000,
  allowOverlap: false,
  run: async (ctx) => {
    logger.log(`run ${ctx.runId} attempt ${ctx.attempt}`);
    await getSystemHealthCheckRunner().run(ctx);
  },
};
