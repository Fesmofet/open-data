import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { NewPostReply } from '@opden-data-layer/odl-db-types';

export type PostReplyRoot = {
  root_author: string;
  root_permlink: string;
};

@Injectable()
export class PostRepliesRepository {
  private readonly logger = new Logger(PostRepliesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async upsertReply(row: NewPostReply): Promise<void> {
    try {
      await this.db
        .insertInto('post_replies')
        .values(row)
        .onConflict((oc) =>
          oc.columns(['author', 'permlink']).doUpdateSet({
            root_author: row.root_author,
            root_permlink: row.root_permlink,
            parent_author: row.parent_author,
            parent_permlink: row.parent_permlink,
            created_unix: row.created_unix,
          }),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async resolveRoot(
    parentAuthor: string,
    parentPermlink: string,
  ): Promise<PostReplyRoot | null> {
    try {
      const parentPost = await this.db
        .selectFrom('posts')
        .select(['root_author', 'root_permlink'])
        .where('author', '=', parentAuthor)
        .where('permlink', '=', parentPermlink)
        .executeTakeFirst();

      if (
        parentPost?.root_author != null &&
        parentPost.root_permlink != null &&
        parentPost.root_author !== '' &&
        parentPost.root_permlink !== ''
      ) {
        return {
          root_author: parentPost.root_author,
          root_permlink: parentPost.root_permlink,
        };
      }

      const parentReply = await this.db
        .selectFrom('post_replies')
        .select(['root_author', 'root_permlink'])
        .where('author', '=', parentAuthor)
        .where('permlink', '=', parentPermlink)
        .executeTakeFirst();

      if (parentReply) {
        return {
          root_author: parentReply.root_author,
          root_permlink: parentReply.root_permlink,
        };
      }

      const rootPost = await this.db
        .selectFrom('posts')
        .select(['author', 'permlink'])
        .where('author', '=', parentAuthor)
        .where('permlink', '=', parentPermlink)
        .where((eb) =>
          eb.or([eb('depth', '=', 0), eb('depth', 'is', null)]),
        )
        .executeTakeFirst();

      if (rootPost) {
        return {
          root_author: parentAuthor,
          root_permlink: parentPermlink,
        };
      }

      return null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }
}
