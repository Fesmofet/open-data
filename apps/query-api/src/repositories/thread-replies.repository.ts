import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class ThreadRepliesRepository {
  private readonly logger = new Logger(ThreadRepliesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async countUnreadOnUserThreads(
    profileName: string,
    cursorUnix: number | null,
    mutedAuthors: readonly string[],
  ): Promise<number> {
    const trimmed = profileName.trim();
    if (trimmed.length === 0) {
      return 0;
    }

    try {
      let query = this.db
        .selectFrom('thread_replies')
        .innerJoin('threads', (join) =>
          join
            .onRef('threads.author', '=', 'thread_replies.parent_author')
            .onRef('threads.permlink', '=', 'thread_replies.parent_permlink'),
        )
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('threads.deleted', '=', false)
        .where((eb) =>
          eb.or([
            eb.and([
              sql<boolean>`LOWER(threads.author) = LOWER(${trimmed})`,
              eb('threads.bulk_message', '=', false),
            ]),
            sql<boolean>`EXISTS (SELECT 1 FROM unnest(threads.mentions) AS m WHERE LOWER(m) = LOWER(${trimmed}))`,
          ]),
        )
        .where(sql<boolean>`LOWER(thread_replies.author) <> LOWER(${trimmed})`);

      if (cursorUnix !== null) {
        query = query.where('thread_replies.created_unix', '>', cursorUnix);
      }

      if (mutedAuthors.length > 0) {
        query = query.where('thread_replies.author', 'not in', [...mutedAuthors]);
      }

      const row = await query.executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (error) {
      this.logger.error(
        `countUnreadOnUserThreads failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
