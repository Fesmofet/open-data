import { Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { OdlDatabase, UserNotificationSettings } from '@opden-data-layer/core';
import { KYSELY } from '../database';
import { Inject } from '@nestjs/common';

@Injectable()
export class UserNotificationSettingsRepository {
  private readonly logger = new Logger(UserNotificationSettingsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<OdlDatabase>) {}

  async findByAccount(
    account: string,
  ): Promise<UserNotificationSettings | null> {
    try {
      const row = await this.db
        .selectFrom('user_notification_settings')
        .selectAll()
        .where('account', '=', account)
        .executeTakeFirst();
      return row ?? null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }
}
