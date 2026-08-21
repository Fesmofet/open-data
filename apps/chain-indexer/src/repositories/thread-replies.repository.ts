import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { NewThreadReply } from '@opden-data-layer/odl-db-types';

@Injectable()
export class ThreadRepliesRepository {
  private readonly logger = new Logger(ThreadRepliesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async upsertReply(row: NewThreadReply): Promise<void> {
    try {
      await this.db
        .insertInto('thread_replies')
        .values(row)
        .onConflict((oc) =>
          oc.columns(['author', 'permlink']).doUpdateSet({
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
}
