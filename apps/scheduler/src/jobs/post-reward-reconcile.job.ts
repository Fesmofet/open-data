import { Logger } from '@nestjs/common';
import type { CronJobDefinition } from './cron-job.types';
import { getPostRewardReconcileRunnerForJob } from './post-reward-reconcile.runner';

const logger = new Logger('waiv-post-reconcile');

export const postRewardReconcileJob: CronJobDefinition = {
  name: 'waiv-post-reconcile',
  schedule: '15 * * * *',
  category: 'batch',
  enabled: true,
  timeoutMs: 3_600_000,
  lockTtlSec: 120,
  retryCount: 0,
  retryDelayMs: 10_000,
  allowOverlap: false,
  run: async (ctx) => {
    logger.log(`run ${ctx.runId} attempt ${ctx.attempt}`);
    await getPostRewardReconcileRunnerForJob().run(ctx);
  },
};
