import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  HiveClientModule,
  HiveEngineClientModule,
  type HiveEngineClientModuleOptions,
  HIVE_RPC_NODES,
  RedisClientModule,
} from '@opden-data-layer/clients';
import { ConsumersModule } from './consumers/consumers.module';
import notificationsConfig from './config/notifications.config';
import { DatabaseModule } from './database';
import { DomainModule } from './domain/domain.module';
import { TelegramOpsModule } from './telegram-ops/telegram-ops.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/notifications/.env', '.env'],
      load: [notificationsConfig],
    }),
    RedisClientModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('redis.uri', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),
    HiveClientModule.forRoot({
      nodes: [...HIVE_RPC_NODES],
      cachePrefix: 'notifications:hive-rpc',
      cacheTtlSeconds: 120,
      maxResponseTimeMs: 8000,
      urlRotationDb: 0,
    }),
    HiveEngineClientModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): HiveEngineClientModuleOptions => {
        const hive = config.get<HiveEngineClientModuleOptions | undefined>(
          'hiveEngine.client',
        );
        if (!hive?.nodes?.length) {
          throw new Error(
            'notifications: hiveEngine.client.nodes is missing or empty',
          );
        }
        return hive;
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    WsModule,
    DomainModule,
    ConsumersModule,
    TelegramOpsModule,
  ],
})
export class MainModule {}
