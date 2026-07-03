import { Logger } from '@nestjs/common';
import type { CronJobDefinition } from './cron-job.types';
import { getPostExpertiseBackfillRunnerForJob } from './post-expertise-backfill.runner';

const logger = new Logger('post-expertise-backfill');

export const postExpertiseBackfillJob: CronJobDefinition = {
  name: 'post-expertise-backfill',
  schedule: '*/30 * * * *',
  category: 'batch',
  enabled: true,
  timeoutMs: 1_800_000,
  lockTtlSec: 120,
  retryCount: 0,
  retryDelayMs: 10_000,
  allowOverlap: false,
  run: async (ctx) => {
    logger.log(`run ${ctx.runId} attempt ${ctx.attempt}`);
    await getPostExpertiseBackfillRunnerForJob().run(ctx);
  },
};
