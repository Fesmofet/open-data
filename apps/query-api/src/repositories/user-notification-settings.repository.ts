import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { UserNotificationSettings } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class UserNotificationSettingsRepository {
  private readonly logger = new Logger(UserNotificationSettingsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByAccount(account: string): Promise<UserNotificationSettings | null> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return null;
    }
    try {
      const row = await this.db
        .selectFrom('user_notification_settings')
        .selectAll()
        .where('account', '=', trimmed)
        .executeTakeFirst();
      return row ?? null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }
}
