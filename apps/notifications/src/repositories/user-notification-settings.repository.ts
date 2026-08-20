import { Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { OdlDatabase, UserNotificationSettings } from '@opden-data-layer/odl-db-types';

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

  async findByAccounts(
    accounts: string[],
  ): Promise<UserNotificationSettings[]> {
    if (accounts.length === 0) {
      return [];
    }
    try {
      return await this.db
        .selectFrom('user_notification_settings')
        .selectAll()
        .where('account', 'in', accounts)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
