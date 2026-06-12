import { Logger } from '@nestjs/common';
import type { CronJobDefinition } from './cron-job.types';
import { getPostRewardsFinalizeRunnerForJob } from './post-rewards-finalize.runner';

const logger = new Logger('post-rewards-finalize');

export const postRewardsFinalizeJob: CronJobDefinition = {
  name: 'post-rewards-finalize',
  schedule: '*/15 * * * *',
  category: 'batch',
  enabled: true,
  timeoutMs: 1_800_000,
  lockTtlSec: 120,
  retryCount: 0,
  retryDelayMs: 10_000,
  allowOverlap: false,
  run: async (ctx) => {
    logger.log(`run ${ctx.runId} attempt ${ctx.attempt}`);
    await getPostRewardsFinalizeRunnerForJob().run(ctx);
  },
};
