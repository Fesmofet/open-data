import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CoinGeckoClientModule,
  ExchangeRateClientModule,
  HiveClientModule,
  HiveEngineClientModule,
  HiveEngineHistoryClientModule,
  type HiveEngineClientModuleOptions,
  HIVE_RPC_NODES,
  RedisClientModule,
} from '@opden-data-layer/clients';
import { CurrencyModule } from '@opden-data-layer/currency';
import { CurrencyCollectRunner } from '../jobs/currency-collect.runner';
import { DatabaseModule, KYSELY } from '../database';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SchedulerCronService } from './scheduler-cron.service';
import { SchedulerDispatchService } from './scheduler-dispatch.service';
import { SchedulerLockService } from './scheduler-lock.service';
import { SchedulerWorkerService } from './scheduler-worker.service';
import { HiveGlobalPropertiesWarmRunner } from '../jobs/hive-global-properties-warm.runner';
import { SiteRegistryDailyRunner } from '../jobs/site-registry-daily.runner';
import { PostRewardReconcileRunner } from '../jobs/post-reward-reconcile.runner';
import { PostRewardsFinalizeRunner } from '../jobs/post-rewards-finalize.runner';
import { WaivPowerAvgRunner } from '../jobs/waiv-power-avg.runner';
import { PostRewardsFinalizeQueue } from '../queues/post-rewards-finalize.queue';
import { PostWaivReconcileQueue } from '../queues/post-waiv-reconcile.queue';
import { WaivRewardPoolCache } from '../services/waiv-reward-pool.cache';

@Module({
  imports: [
    DatabaseModule,
    RepositoriesModule,
    HiveClientModule.forRoot({
      nodes: [...HIVE_RPC_NODES],
      cachePrefix: 'scheduler:hive-rpc',
      cacheTtlSeconds: 1200,
      maxResponseTimeMs: 8000,
      urlRotationDb: 0,
    }),
    CurrencyModule.register({
      kyselyToken: KYSELY,
      includeCollectService: true,
      imports: [
        CoinGeckoClientModule.forRootAsync({
          useFactory: (config: ConfigService) => ({
            baseUrl: config.get<string>(
              'currency.coinGecko.baseUrl',
              'https://api.coingecko.com/api/v3',
            ),
            apiKey: config.get<string | undefined>('currency.coinGecko.apiKey'),
            requestTimeoutMs: config.get<number>(
              'currency.coinGecko.requestTimeoutMs',
              12_000,
            ),
          }),
          inject: [ConfigService],
        }),
        ExchangeRateClientModule.forRootAsync({
          useFactory: (config: ConfigService) => ({
            baseUrl: config.get<string>(
              'currency.exchangeRate.baseUrl',
              'https://api.exchangerate.host',
            ),
            accessKey: config.get<string | undefined>(
              'currency.exchangeRate.accessKey',
            ),
            requestTimeoutMs: config.get<number>(
              'currency.exchangeRate.requestTimeoutMs',
              12_000,
            ),
          }),
          inject: [ConfigService],
        }),
        HiveEngineClientModule.forRootAsync({
          useFactory: (config: ConfigService): HiveEngineClientModuleOptions => {
            const hive = config.get<HiveEngineClientModuleOptions | undefined>(
              'hiveEngine.client',
            );
            if (!hive?.nodes?.length) {
              throw new Error('scheduler: hiveEngine.client.nodes is missing or empty');
            }
            return hive;
          },
          inject: [ConfigService],
        }),
      ],
    }),
    RedisClientModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('redis.uri', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),
    HiveEngineHistoryClientModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const client = config.get<{
          nodes: string[];
          cachePrefix?: string;
          cacheTtlSeconds?: number;
          maxResponseTimeMs?: number;
          urlRotationDb?: number;
        }>('hiveEngine.historyClient');
        if (!client?.nodes?.length) {
          throw new Error('scheduler: hiveEngine.historyClient.nodes is missing or empty');
        }
        return client;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    SiteRegistryDailyRunner,
    HiveGlobalPropertiesWarmRunner,
    WaivPowerAvgRunner,
    PostRewardReconcileRunner,
    PostRewardsFinalizeRunner,
    PostWaivReconcileQueue,
    PostRewardsFinalizeQueue,
    WaivRewardPoolCache,
    CurrencyCollectRunner,
    SchedulerLockService,
    SchedulerDispatchService,
    SchedulerWorkerService,
    SchedulerCronService,
  ],
  exports: [SchedulerDispatchService, SchedulerWorkerService],
})
export class SchedulerModule {}
