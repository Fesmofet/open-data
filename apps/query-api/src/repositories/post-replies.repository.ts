import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../database';
import { KYSELY } from '../database';
import { ROOT_POST_PREDICATE_POSTS } from './user-blog-post-scope';

@Injectable()
export class PostRepliesRepository {
  private readonly logger = new Logger(PostRepliesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async countUnreadOnUserPosts(
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
        .selectFrom('post_replies')
        .innerJoin('posts', (join) =>
          join
            .onRef('posts.author', '=', 'post_replies.root_author')
            .onRef('posts.permlink', '=', 'post_replies.root_permlink'),
        )
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where(sql<boolean>`LOWER(post_replies.root_author) = LOWER(${trimmed})`)
        .where(sql<boolean>`LOWER(post_replies.author) <> LOWER(${trimmed})`)
        .where(ROOT_POST_PREDICATE_POSTS);

      if (cursorUnix !== null) {
        query = query.where('post_replies.created_unix', '>', cursorUnix);
      }

      if (mutedAuthors.length > 0) {
        query = query.where('post_replies.author', 'not in', [...mutedAuthors]);
      }

      const row = await query.executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (error) {
      this.logger.error(
        `countUnreadOnUserPosts failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
