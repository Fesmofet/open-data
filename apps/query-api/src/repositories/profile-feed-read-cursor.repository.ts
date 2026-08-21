import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';

import type { Database } from '../database';
import { KYSELY } from '../database';

export type ProfileFeedReadCursors = {
  posts: number | null;
  threads: number | null;
};

type ProfileFeedReadTab = 'posts' | 'threads';

const USER_METADATA_INSERT_DEFAULTS = {
  notifications_last_timestamp: 0,
  exit_page_setting: true,
  locale: 'en-US',
  post_locales: [],
  nightmode: false,
  reward_setting: '50' as const,
  rewrite_links: false,
  show_nsfw_posts: false,
  upvote_setting: false,
  vote_percent: 5000,
  voting_power: true,
  currency: null,
  hide_linked_objects: false,
  hide_recipe_objects: false,
  hide_favorite_objects: false,
  profile_posts_last_read_at_unix: null,
  profile_threads_last_read_at_unix: null,
};

@Injectable()
export class ProfileFeedReadCursorRepository {
  private readonly logger = new Logger(ProfileFeedReadCursorRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async getCursors(account: string): Promise<ProfileFeedReadCursors | null> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return null;
    }
    try {
      const row = await this.db
        .selectFrom('user_metadata')
        .select([
          'profile_posts_last_read_at_unix',
          'profile_threads_last_read_at_unix',
        ])
        .where('account', '=', trimmed)
        .executeTakeFirst();
      if (!row) {
        return null;
      }
      return {
        posts: row.profile_posts_last_read_at_unix,
        threads: row.profile_threads_last_read_at_unix,
      };
    } catch (error) {
      this.logger.error(
        `getCursors failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async setCursorMonotonic(
    account: string,
    tab: ProfileFeedReadTab,
    readAtUnix: number,
  ): Promise<boolean> {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      return false;
    }

    const column =
      tab === 'posts'
        ? 'profile_posts_last_read_at_unix'
        : 'profile_threads_last_read_at_unix';

    try {
      const result = await this.db
        .updateTable('user_metadata')
        .set({ [column]: readAtUnix })
        .where('account', '=', trimmed)
        .where((eb) =>
          eb.or([
            eb(column, 'is', null),
            eb(column, '<', readAtUnix),
          ]),
        )
        .executeTakeFirst();

      if (Number(result.numUpdatedRows) > 0) {
        return true;
      }

      const existing = await this.db
        .selectFrom('user_metadata')
        .select('account')
        .where('account', '=', trimmed)
        .executeTakeFirst();
      if (existing) {
        return false;
      }

      await this.db
        .insertInto('user_metadata')
        .values({
          account: trimmed,
          ...USER_METADATA_INSERT_DEFAULTS,
          [column]: readAtUnix,
        })
        .execute();
      return true;
    } catch (error) {
      this.logger.error(
        `setCursorMonotonic failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
