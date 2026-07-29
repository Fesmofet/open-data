import { Module } from '@nestjs/common';
import { NotificationRecipientsRepository } from './notification-recipients.repository';
import { UserNotificationSettingsRepository } from './user-notification-settings.repository';
import { NotificationReadCursorRepository } from './notification-read-cursor.repository';
import { TelegramSubscriptionsRepository } from './telegram-subscriptions.repository';

@Module({
  providers: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
    TelegramSubscriptionsRepository,
  ],
  exports: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
    TelegramSubscriptionsRepository,
  ],
})
export class RepositoriesModule {}
