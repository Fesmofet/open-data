import { Injectable, ForbiddenException } from '@nestjs/common';
import type { Message } from '@opden-data-layer/core';
import {
  MessagingRepository,
} from '../../repositories';
import {
  decodeMessageCursor,
  encodeMessageCursor,
} from './message-feed-cursor';
import type { MessageHistoryBody } from './schemas/messaging.schema';

export type MessageDto = {
  message_id: string;
  channel_id: string;
  author: string;
  body: string | null;
  overflow_ref: string | null;
  reply_to: string | null;
  quote_json: unknown;
  attachments: unknown;
  mentions: string[];
  created_at_unix: number;
};

export type MessageHistoryResponseDto = {
  items: MessageDto[];
  cursor: string | null;
  hasMore: boolean;
};

@Injectable()
export class GetChannelMessagesEndpoint {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(
    channelId: string,
    body: MessageHistoryBody,
    viewer?: string,
  ): Promise<MessageHistoryResponseDto | null> {
    const channel = await this.messagingRepo.findChannelById(channelId.trim());
    if (!channel) {
      return null;
    }

    if (channel.kind !== 'object') {
      const viewerTrimmed = viewer?.trim() ?? '';
      if (!viewerTrimmed) {
        throw new ForbiddenException('Membership required');
      }
      const isMember = await this.messagingRepo.isMember(channel.channel_id, viewerTrimmed);
      if (!isMember) {
        throw new ForbiddenException('Not a channel member');
      }
    }

    return this.fetchMessages(
      channel.channel_id,
      body,
      [],
      body.for_context ? viewer?.trim() : undefined,
    );
  }

  async fetchMessages(
    channelId: string,
    body: MessageHistoryBody,
    excludedAuthors: readonly string[],
    forContextViewer?: string,
  ): Promise<MessageHistoryResponseDto> {
    const limit = body.limit;
    const limitPlusOne = limit + 1;
    const cursorPayload = body.cursor ? decodeMessageCursor(body.cursor) : null;
    if (body.cursor && !cursorPayload) {
      return { items: [], cursor: null, hasMore: false };
    }

    const rows = await this.messagingRepo.listChannelMessages(
      channelId,
      excludedAuthors,
      cursorPayload,
      limitPlusOne,
      forContextViewer,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const items = page.map(mapMessage);
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeMessageCursor({
            createdAtUnix: last.created_at_unix,
            eventSeq: last.event_seq,
          })
        : null;

    return { items, cursor: nextCursor, hasMore };
  }
}

function mapMessage(row: Message): MessageDto {
  return {
    message_id: row.message_id,
    channel_id: row.channel_id,
    author: row.author,
    body: row.body,
    overflow_ref: row.overflow_ref,
    reply_to: row.reply_to,
    quote_json: row.quote_json,
    attachments: row.attachments,
    mentions: row.mentions,
    created_at_unix: row.created_at_unix,
  };
}
