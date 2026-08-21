import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { Channel, ChannelMember, Message } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';
import type { ChannelCursorPayload, MessageCursorPayload } from '../domain/messaging/message-feed-cursor';

@Injectable()
export class MessagingRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async listViewerChannels(
    viewer: string,
    kind: string | undefined,
    cursor: ChannelCursorPayload | null,
    limitPlusOne: number,
  ): Promise<Channel[]> {
    let query = this.db
      .selectFrom('channels')
      .innerJoin('channel_members', 'channel_members.channel_id', 'channels.channel_id')
      .selectAll('channels')
      .where('channel_members.account', '=', viewer)
      .where('channels.dissolved_at_unix', 'is', null)
      .orderBy('channels.last_message_at_unix', 'desc')
      .orderBy('channels.channel_id', 'desc')
      .limit(limitPlusOne);

    if (kind) {
      query = query.where('channels.kind', '=', kind);
    }

    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb('channels.last_message_at_unix', '<', cursor.lastMessageAtUnix),
          eb.and([
            eb('channels.last_message_at_unix', '=', cursor.lastMessageAtUnix),
            eb('channels.channel_id', '<', cursor.channelId),
          ]),
        ]),
      );
    }

    return query.execute();
  }

  async findChannelById(channelId: string): Promise<Channel | undefined> {
    return this.db
      .selectFrom('channels')
      .selectAll()
      .where('channel_id', '=', channelId)
      .executeTakeFirst();
  }

  async findChannelByAlias(alias: string): Promise<Channel | undefined> {
    const row = await this.db
      .selectFrom('channel_aliases')
      .innerJoin('channels', 'channels.channel_id', 'channel_aliases.channel_id')
      .selectAll('channels')
      .where('channel_aliases.alias', '=', alias)
      .executeTakeFirst();
    return row;
  }

  async findObjectChannel(objectId: string): Promise<Channel | undefined> {
    return this.db
      .selectFrom('channels')
      .selectAll()
      .where('object_id', '=', objectId)
      .where('kind', '=', 'object')
      .executeTakeFirst();
  }

  async listMembers(channelId: string): Promise<ChannelMember[]> {
    return this.db
      .selectFrom('channel_members')
      .selectAll()
      .where('channel_id', '=', channelId)
      .orderBy('joined_at_unix', 'asc')
      .execute();
  }

  async isMember(channelId: string, account: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('channel_members')
      .select('account')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .executeTakeFirst();
    return row !== undefined;
  }

  async countMembers(channelId: string): Promise<number> {
    const row = await this.db
      .selectFrom('channel_members')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('channel_id', '=', channelId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async getMemberRole(channelId: string, account: string): Promise<string | undefined> {
    const row = await this.db
      .selectFrom('channel_members')
      .select('role')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .executeTakeFirst();
    return row?.role;
  }

  async getMemberLastReadAt(
    channelId: string,
    account: string,
  ): Promise<number | null> {
    const row = await this.db
      .selectFrom('channel_members')
      .select('last_read_at_unix')
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .executeTakeFirst();
    return row?.last_read_at_unix ?? null;
  }

  async countTotalUnreadForViewer(viewer: string): Promise<number> {
    const viewerTrimmed = viewer.trim();
    if (viewerTrimmed.length === 0) {
      return 0;
    }

    const row = await this.db
      .selectFrom('messages')
      .innerJoin('channel_members', 'channel_members.channel_id', 'messages.channel_id')
      .innerJoin('channels', 'channels.channel_id', 'messages.channel_id')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('channel_members.account', '=', viewerTrimmed)
      .where('channels.dissolved_at_unix', 'is', null)
      .where('messages.author', '!=', viewerTrimmed)
      .where((eb) =>
        eb.or([
          eb('channel_members.last_read_at_unix', 'is', null),
          eb(
            'messages.created_at_unix',
            '>',
            eb.ref('channel_members.last_read_at_unix'),
          ),
        ]),
      )
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async countUnreadMessages(
    channelId: string,
    viewer: string,
    lastReadAtUnix: number | null,
  ): Promise<number> {
    let query = this.db
      .selectFrom('messages')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('channel_id', '=', channelId)
      .where('author', '!=', viewer);

    if (lastReadAtUnix !== null) {
      query = query.where('created_at_unix', '>', lastReadAtUnix);
    }

    const row = await query.executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async setLastReadAt(
    channelId: string,
    account: string,
    lastReadAtUnix: number,
  ): Promise<boolean> {
    const result = await this.db
      .updateTable('channel_members')
      .set({ last_read_at_unix: lastReadAtUnix })
      .where('channel_id', '=', channelId)
      .where('account', '=', account)
      .where((eb) =>
        eb.or([
          eb('last_read_at_unix', 'is', null),
          eb('last_read_at_unix', '<', lastReadAtUnix),
        ]),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  async getLastMessagePreview(channelId: string): Promise<{
    preview: string | null;
    encrypted: boolean;
  }> {
    const row = await this.db
      .selectFrom('messages')
      .select(['body', 'overflow_ref', 'encryption_mode'])
      .where('channel_id', '=', channelId)
      .orderBy('created_at_unix', 'desc')
      .orderBy('event_seq', 'desc')
      .limit(1)
      .executeTakeFirst();
    if (!row) {
      return { preview: null, encrypted: false };
    }
    if (row.encryption_mode != null) {
      return { preview: null, encrypted: true };
    }
    if (row.body != null && row.body.trim() !== '') {
      return { preview: row.body, encrypted: false };
    }
    if (row.overflow_ref != null && row.overflow_ref.trim() !== '') {
      return { preview: row.overflow_ref, encrypted: false };
    }
    return { preview: null, encrypted: false };
  }

  async listChannelMessages(
    channelId: string,
    excludedAuthors: readonly string[],
    cursor: MessageCursorPayload | null,
    limitPlusOne: number,
    forContextViewer?: string,
  ): Promise<Message[]> {
    let query = this.db
      .selectFrom('messages')
      .selectAll()
      .where('channel_id', '=', channelId)
      .orderBy('created_at_unix', 'desc')
      .orderBy('event_seq', 'desc')
      .limit(limitPlusOne);

    if (excludedAuthors.length > 0) {
      query = query.where('author', 'not in', excludedAuthors as string[]);
    }

    if (forContextViewer) {
      query = query.where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('message_context_exclusions')
              .select('message_id')
              .whereRef('message_context_exclusions.message_id', '=', 'messages.message_id')
              .where('excluded_by', '=', forContextViewer),
          ),
        ),
      );
    }

    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb('created_at_unix', '<', cursor.createdAtUnix),
          eb.and([
            eb('created_at_unix', '=', cursor.createdAtUnix),
            eb('event_seq', '<', cursor.eventSeq),
          ]),
        ]),
      );
    }

    return query.execute();
  }

  async listContextExcludedMessageIds(
    viewer: string,
    messageIds: readonly string[],
  ): Promise<string[]> {
    if (messageIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .selectFrom('message_context_exclusions')
      .select('message_id')
      .where('excluded_by', '=', viewer)
      .where('message_id', 'in', messageIds as string[])
      .execute();
    return rows.map((r) => r.message_id);
  }
}
