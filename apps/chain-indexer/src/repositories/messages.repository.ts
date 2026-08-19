import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type {
  Message,
  NewMessage,
  NewMessageContextExclusion,
  NewMessageTombstone,
} from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { DbExecutor } from './channels.repository';

@Injectable()
export class MessagesRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async findById(messageId: string, trx?: DbExecutor): Promise<Message | undefined> {
    return this.executor(trx)
      .selectFrom('messages')
      .selectAll()
      .where('message_id', '=', messageId)
      .executeTakeFirst();
  }

  async tombstoneExists(messageId: string, trx?: DbExecutor): Promise<boolean> {
    const row = await this.executor(trx)
      .selectFrom('message_tombstones')
      .select('message_id')
      .where('message_id', '=', messageId)
      .executeTakeFirst();
    return row !== undefined;
  }

  async insertMessage(row: NewMessage, trx?: DbExecutor): Promise<void> {
    await this.executor(trx).insertInto('messages').values(row).execute();
  }

  async deleteAndTombstone(
    tombstone: NewMessageTombstone,
    trx?: DbExecutor,
  ): Promise<void> {
    const e = this.executor(trx);
    await e.deleteFrom('messages').where('message_id', '=', tombstone.message_id).execute();
    await e
      .insertInto('message_tombstones')
      .values(tombstone)
      .onConflict((oc) => oc.column('message_id').doNothing())
      .execute();
  }

  async upsertContextExclusion(
    row: NewMessageContextExclusion,
    trx?: DbExecutor,
  ): Promise<void> {
    await this.executor(trx)
      .insertInto('message_context_exclusions')
      .values(row)
      .onConflict((oc) => oc.column('message_id').doNothing())
      .execute();
  }
}
