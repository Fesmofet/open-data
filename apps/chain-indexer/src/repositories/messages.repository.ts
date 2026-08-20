import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { Message, NewMessage, NewMessageContextExclusion, NewMessageTombstone } from '@opden-data-layer/odl-db-types';

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

  async listByAuthorInChannel(
    channelId: string,
    author: string,
    trx?: DbExecutor,
  ): Promise<Message[]> {
    return this.executor(trx)
      .selectFrom('messages')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('author', '=', author)
      .execute();
  }

  async deleteAllByAuthorInChannel(
    input: {
      channelId: string;
      author: string;
      deletedBy: string;
      deletedAtUnix: number;
      eventSeq: bigint;
      transactionId: string;
    },
    trx?: DbExecutor,
  ): Promise<void> {
    const messages = await this.listByAuthorInChannel(
      input.channelId,
      input.author,
      trx,
    );
    for (const message of messages) {
      if (await this.tombstoneExists(message.message_id, trx)) {
        continue;
      }
      await this.deleteAndTombstone(
        {
          message_id: message.message_id,
          channel_id: input.channelId,
          deleted_by: input.deletedBy,
          deleted_at_unix: input.deletedAtUnix,
          event_seq: input.eventSeq,
          transaction_id: input.transactionId,
        },
        trx,
      );
    }
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
