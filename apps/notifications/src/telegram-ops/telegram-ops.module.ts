import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisClientModule } from '@opden-data-layer/clients';
import {
  DEFAULT_BLOCK_CURSOR_CHECKS,
  DEFAULT_BLOCK_LAG_BUFFER,
  SystemHealthModule,
} from '@opden-data-layer/system-alerts';
import { RepositoriesModule } from '../repositories/repositories.module';
import { TelegramApiClient } from '../telegram/telegram-api.client';
import { TelegramOpsPollerService } from './telegram-ops-poller.service';
import { TelegramOpsSenderService } from './telegram-ops-sender.service';

@Module({
  imports: [
    ConfigModule,
    RedisClientModule,
    RepositoriesModule,
    SystemHealthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        checks: DEFAULT_BLOCK_CURSOR_CHECKS,
        lagBuffer:
          config.get<number>('systemHealth.blockLagBuffer') ??
          DEFAULT_BLOCK_LAG_BUFFER,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: TelegramApiClient,
      useFactory: (config: ConfigService) =>
        new TelegramApiClient(
          config.get<string>('telegramOps.botToken') ?? '',
        ),
      inject: [ConfigService],
    },
    TelegramOpsPollerService,
    TelegramOpsSenderService,
  ],
})
export class TelegramOpsModule {}
