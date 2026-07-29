import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisClientModule } from '@opden-data-layer/clients';
import { RepositoriesModule } from '../repositories/repositories.module';
import { TelegramApiClient } from './telegram-api.client';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramPollerService } from './telegram-poller.service';
import { TelegramSenderService } from './telegram-sender.service';

@Module({
  imports: [ConfigModule, RedisClientModule, RepositoriesModule],
  providers: [
    TelegramApiClient,
    TelegramNotificationService,
    TelegramPollerService,
    TelegramSenderService,
  ],
  exports: [TelegramNotificationService],
})
export class TelegramModule {}
