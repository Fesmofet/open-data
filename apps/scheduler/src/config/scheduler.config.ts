import { validateScheduler } from './env.validation';

export default () => {
  const env = validateScheduler(
    process.env as unknown as Record<string, unknown>,
  );
  return {
    postgres: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      database: env.POSTGRES_DATABASE,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      poolMax: env.POSTGRES_POOL_MAX,
    },
    redis: {
      uri: env.REDIS_URI,
    },
    scheduler: {
      workerIntervalMs: env.SCHEDULER_WORKER_INTERVAL_MS,
      workerBatchSize: env.SCHEDULER_WORKER_BATCH_SIZE,
      globalEnabled: env.SCHEDULER_GLOBAL_ENABLED,
      disabledJobNames: env.SCHEDULER_DISABLED_JOBS,
      defaultLockTtlMaxSec: env.SCHEDULER_DEFAULT_LOCK_TTL_MAX_SEC,
      enqueueLockTokenTtlSec: env.SCHEDULER_ENQUEUE_LOCK_TOKEN_TTL_SEC,
    },
    siteCanonical: {
      fallbackOrigin: env.SITE_CANONICAL_FALLBACK_ORIGIN,
      dailyPageSize: env.SITE_CANONICAL_DAILY_PAGE_SIZE,
    },
    currency: {
      coinGecko: {
        baseUrl: env.COINGECKO_API_BASE_URL,
        apiKey: env.COINGECKO_API_KEY,
        requestTimeoutMs: env.CURRENCY_EXTERNAL_REQUEST_TIMEOUT_MS,
      },
      exchangeRate: {
        baseUrl: env.EXCHANGE_RATE_HOST_BASE_URL,
        accessKey: env.EXCHANGE_RATE_ACCESS_KEY,
        requestTimeoutMs: env.CURRENCY_EXTERNAL_REQUEST_TIMEOUT_MS,
      },
    },
    hiveEngine: {
      client: {
        nodes: env.HIVE_ENGINE_NODES,
        cachePrefix: 'scheduler:hive-engine',
        cacheTtlSeconds: 1200,
        maxResponseTimeMs: 8000,
        urlRotationDb: 0,
      },
      historyClient: {
        nodes: env.HIVE_ENGINE_HISTORY_NODES,
        cachePrefix: env.HIVE_ENGINE_HISTORY_CACHE_PREFIX,
        cacheTtlSeconds: 1200,
        maxResponseTimeMs: env.HIVE_ENGINE_HISTORY_MAX_RESPONSE_TIME_MS,
        urlRotationDb: env.HIVE_ENGINE_HISTORY_URL_ROTATION_DB,
      },
    },
    postRewardsFinalize: {
      delaySec: env.POST_REWARDS_FINALIZE_DELAY_SEC,
      batchSize: env.POST_REWARDS_FINALIZE_BATCH_SIZE,
    },
    postRewardReconcile: {
      batchSize: env.POST_REWARD_RECONCILE_BATCH_SIZE,
    },
  };
};
