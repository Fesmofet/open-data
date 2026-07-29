import { Module } from '@nestjs/common';
import { NotificationRecipientsRepository } from './notification-recipients.repository';
import { UserNotificationSettingsRepository } from './user-notification-settings.repository';
import { NotificationReadCursorRepository } from './notification-read-cursor.repository';
import { OpsTelegramSubscribersRepository } from './ops-telegram-subscribers.repository';
import { TelegramSubscriptionsRepository } from './telegram-subscriptions.repository';

@Module({
  providers: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
    OpsTelegramSubscribersRepository,
    TelegramSubscriptionsRepository,
  ],
  exports: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
    OpsTelegramSubscribersRepository,
    TelegramSubscriptionsRepository,
  ],
})
export class RepositoriesModule {}
