import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisClientModule } from '@opden-data-layer/clients';
import { RepositoriesModule } from '../repositories/repositories.module';
import { TelegramApiClient } from './telegram-api.client';
import { TelegramSubscriptionsCacheService } from './telegram-subscriptions-cache.service';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramPollerService } from './telegram-poller.service';
import { TelegramSenderService } from './telegram-sender.service';

@Module({
  imports: [ConfigModule, RedisClientModule, RepositoriesModule],
  providers: [
    {
      provide: TelegramApiClient,
      useFactory: (config: ConfigService) =>
        new TelegramApiClient(config.get<string>('telegram.botToken') ?? ''),
      inject: [ConfigService],
    },
    TelegramNotificationService,
    TelegramSubscriptionsCacheService,
    TelegramPollerService,
    TelegramSenderService,
  ],
  exports: [TelegramNotificationService],
})
export class TelegramModule {}
