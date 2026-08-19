import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type {
  Channel,
  ChannelMember,
  JsonValue,
  NewChannel,
  NewChannelAlias,
  NewChannelMember,
} from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class ChannelsRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async runInTransaction<T>(fn: (trx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(fn);
  }

  async findById(channelId: string, trx?: DbExecutor): Promise<Channel | undefined> {
    return this.executor(trx)
      .selectFrom('channels')
      .selectAll()
      .where('channel_id', '=', channelId)
      .executeTakeFirst();
  }

  async findByPairHash(pairHash: string, trx?: DbExecutor): Promise<Channel | undefined> {
    return this.executor(trx)
      .selectFrom('channels')
      .selectAll()
      .where('pair_hash', '=', pairHash)
      .where('kind', '=', 'direct')
      .executeTakeFirst();
  }

  async findByObjectId(objectId: string, trx?: DbExecutor): Promise<Channel | undefined> {
    return this.executor(trx)
      .selectFrom('channels')
      .selectAll()
      .where('object_id', '=', objectId)
      .where('kind', '=', 'object')
      .executeTakeFirst();
  }

  async insertChannel(row: NewChannel, trx?: DbExecutor): Promise<void> {
    await this.executor(trx).insertInto('channels').values(row).execute();
  }

  async insertMember(row: NewChannelMember, trx?: DbExecutor): Promise<void> {
    await this.executor(trx)
      .insertInto('channel_members')
      .values(row)
      .onConflict((oc) => oc.columns(['channel_id', 'account']).doNothing())
      .execute();
  }

  async insertAlias(row: NewChannelAlias, trx?: DbExecutor): Promise<void> {
    await this.executor(trx)
      .insertInto('channel_aliases')
      .values(row)
      .onConflict((oc) => oc.column('alias').doNothing())
      .execute();
  }

  async findAlias(alias: string, trx?: DbExecutor): Promise<{ alias: string; channel_id: string } | undefined> {
    return this.executor(trx)
      .selectFrom('channel_aliases')
      .select(['alias', 'channel_id'])
      .where('alias', '=', alias)
      .executeTakeFirst();
  }

  async updateLastMessageAt(
    channelId: string,
    lastMessageAtUnix: number,
    trx?: DbExecutor,
  ): Promise<void> {
    await this.executor(trx)
      .updateTable('channels')
      .set({ last_message_at_unix: lastMessageAtUnix })
      .where('channel_id', '=', channelId)
      .execute();
  }

  async updateGroupMeta(
    channelId: string,
    patch: { title?: string; image?: JsonValue | null },
    trx?: DbExecutor,
  ): Promise<void> {
    const set: { title?: string; image?: JsonValue | null } = {};
    if (patch.title !== undefined) {
      set.title = patch.title;
    }
    if (patch.image !== undefined) {
      set.image = patch.image;
    }
    if (Object.keys(set).length === 0) {
      return;
    }
    await this.executor(trx)
      .updateTable('channels')
      .set(set)
      .where('channel_id', '=', channelId)
      .execute();
  }

  async isMember(channelId: string, account: string, trx?: DbExecutor): Promise<boolean> {
    const row = await this.executor(trx)
      .selectFrom('channel_members')
      .select('account')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .executeTakeFirst();
    return row !== undefined;
  }

  async getMemberRole(
    channelId: string,
    account: string,
    trx?: DbExecutor,
  ): Promise<string | undefined> {
    const row = await this.executor(trx)
      .selectFrom('channel_members')
      .select('role')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .executeTakeFirst();
    return row?.role;
  }

  async countAdmins(channelId: string, trx?: DbExecutor): Promise<number> {
    const row = await this.executor(trx)
      .selectFrom('channel_members')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('channel_id', '=', channelId)
      .where('role', '=', 'admin')
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async countMembers(channelId: string, trx?: DbExecutor): Promise<number> {
    const row = await this.executor(trx)
      .selectFrom('channel_members')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('channel_id', '=', channelId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async updateMemberRole(
    channelId: string,
    account: string,
    role: string,
    trx?: DbExecutor,
  ): Promise<void> {
    await this.executor(trx)
      .updateTable('channel_members')
      .set({ role })
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .execute();
  }

  async dissolveChannel(
    channelId: string,
    dissolvedAtUnix: number,
    trx?: DbExecutor,
  ): Promise<void> {
    await this.executor(trx)
      .updateTable('channels')
      .set({ dissolved_at_unix: dissolvedAtUnix })
      .where('channel_id', '=', channelId)
      .execute();
  }

  async listMembers(channelId: string, trx?: DbExecutor): Promise<ChannelMember[]> {
    return this.executor(trx)
      .selectFrom('channel_members')
      .selectAll()
      .where('channel_id', '=', channelId)
      .orderBy('joined_at_unix', 'asc')
      .execute();
  }

  async removeMember(channelId: string, account: string, trx?: DbExecutor): Promise<void> {
    await this.executor(trx)
      .deleteFrom('channel_members')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .execute();
  }
}
