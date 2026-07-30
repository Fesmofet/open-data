import { Injectable, Logger } from '@nestjs/common';
import { buildRedisKey } from '@opden-data-layer/core';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  UserNotificationSettingsRepository,
  type UserNotificationSettingsUpsertPayload,
} from '../../../repositories/user-notification-settings.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { updateUserNotificationSettingsPayloadSchema } from '../osl-envelope.schema';

const NOTIFICATIONS_APP = 'notifications';

function notificationSettingsCacheKey(account: string): string {
  return buildRedisKey(NOTIFICATIONS_APP, 'cache', 'settings', account);
}

@Injectable()
export class UserNotificationSettingsHandler implements OdlActionHandler {
  readonly action = 'update_user_notification_settings';
  private readonly logger = new Logger(UserNotificationSettingsHandler.name);

  constructor(
    private readonly settingsRepository: UserNotificationSettingsRepository,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = updateUserNotificationSettingsPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid update_user_notification_settings payload for action '${ctx.action}': ${result.error.message}`,
      );
      return;
    }

    try {
      const row: UserNotificationSettingsUpsertPayload = result.data;
      await this.settingsRepository.upsert(ctx.creator, row);
      try {
        await this.redisFactory.getClient().del(notificationSettingsCacheKey(ctx.creator));
      } catch {
        // ignore cache invalidation errors
      }
    } catch (error) {
      this.logger.error(
        `update_user_notification_settings failed for '${ctx.creator}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
