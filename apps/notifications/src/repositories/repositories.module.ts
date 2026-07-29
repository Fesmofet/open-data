import { Module } from '@nestjs/common';
import { NotificationRecipientsRepository } from './notification-recipients.repository';
import { UserNotificationSettingsRepository } from './user-notification-settings.repository';
import { NotificationReadCursorRepository } from './notification-read-cursor.repository';

@Module({
  providers: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
  ],
  exports: [
    NotificationRecipientsRepository,
    UserNotificationSettingsRepository,
    NotificationReadCursorRepository,
  ],
})
export class RepositoriesModule {}
