import type { CronJobDefinition } from './cron-job.types';
import { currencyCronJobDefinitions } from './currency.scheduler-jobs';
import { hiveGlobalPropertiesWarmJob } from './hive-global-properties-warm.job';
import { systemHealthCheckJob } from './system-health-check.job';
import { noopTickJob } from './noop-tick.job';
import { siteRegistryDailyJob } from './site-registry-daily.job';
import { postRewardReconcileJob } from './post-reward-reconcile.job';
import { postRewardsFinalizeJob } from './post-rewards-finalize.job';
import { postExpertiseBackfillJob } from './post-expertise-backfill.job';
import { waivPowerAvgJob } from './waiv-power-avg.job';

/**
 * All scheduled jobs in one list for uniform registration and tooling.
 */
export const cronJobRegistry: CronJobDefinition[] = [
  noopTickJob,
  siteRegistryDailyJob,
  waivPowerAvgJob,
  postRewardReconcileJob,
  postRewardsFinalizeJob,
  postExpertiseBackfillJob,
  hiveGlobalPropertiesWarmJob,
  systemHealthCheckJob,
  ...currencyCronJobDefinitions,
];

export function getJobByName(
  name: string,
): CronJobDefinition | undefined {
  return cronJobRegistry.find((j) => j.name === name);
}
