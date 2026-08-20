import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import { KYSELY } from '../database';

@Injectable()
export class NotificationReadCursorRepository {
  private readonly logger = new Logger(NotificationReadCursorRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<OdlDatabase>) {}

  async getLastReadTimestamp(account: string): Promise<number | null> {
    try {
      const row = await this.db
        .selectFrom('user_metadata')
        .select('notifications_last_timestamp')
        .where('account', '=', account)
        .executeTakeFirst();
      return row?.notifications_last_timestamp ?? null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async setLastReadTimestamp(account: string, unixMs: number): Promise<void> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return;
    }
    try {
      const hasAccount = await this.db
        .selectFrom('accounts_current')
        .select('name')
        .where('name', '=', trimmed)
        .executeTakeFirst();
      if (!hasAccount) {
        this.logger.warn(
          `setLastReadTimestamp: no accounts_current row for ${trimmed}`,
        );
        return;
      }

      await this.db
        .insertInto('user_metadata')
        .values({
          account: trimmed,
          notifications_last_timestamp: unixMs,
          exit_page_setting: true,
          locale: 'en-US',
          post_locales: [],
          nightmode: false,
          reward_setting: '50',
          rewrite_links: false,
          show_nsfw_posts: false,
          upvote_setting: false,
          vote_percent: 5000,
          voting_power: true,
          currency: null,
          hide_linked_objects: false,
          hide_recipe_objects: false,
          hide_favorite_objects: false,
        })
        .onConflict((oc) =>
          oc.column('account').doUpdateSet({
            notifications_last_timestamp: unixMs,
          }),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
    }
  }
}
