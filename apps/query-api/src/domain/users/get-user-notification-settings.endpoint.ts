import { ForbiddenException, Injectable } from '@nestjs/common';
import { normalizeHiveAccount } from '../../auth';
import { UserNotificationSettingsRepository } from '../../repositories/user-notification-settings.repository';
import {
  defaultUserNotificationSettingsView,
  mapUserNotificationSettingsRow,
  type UserNotificationSettingsView,
} from './user-notification-settings.types';

@Injectable()
export class GetUserNotificationSettingsEndpoint {
  constructor(
    private readonly settingsRepository: UserNotificationSettingsRepository,
  ) {}

  async execute(
    accountName: string,
    viewerAccount?: string | null,
  ): Promise<UserNotificationSettingsView> {
    const account = normalizeHiveAccount(accountName);
    const viewer = viewerAccount?.trim()
      ? normalizeHiveAccount(viewerAccount)
      : null;
    if (!viewer || viewer !== account) {
      throw new ForbiddenException();
    }

    const row = await this.settingsRepository.findByAccount(account);
    if (!row) {
      return defaultUserNotificationSettingsView();
    }
    return mapUserNotificationSettingsRow(row);
  }
}
