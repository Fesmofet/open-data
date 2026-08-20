import { Injectable, Logger } from '@nestjs/common';
import { JsonValue } from '@opden-data-layer/odl-db-types';

import {
  blockTimestampToUnixSeconds,
  buildDmAlias,
  buildDmChannelId,
  buildOslMessageId,
  CHANNEL_ACCESS,
  CHANNEL_KINDS,
  CHANNEL_MEMBER_ROLES,
} from '@opden-data-layer/core';
import { computeDmPairHash } from '@opden-data-layer/core/utils/osl-messaging-crypto';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import { MessagesRepository } from '../../../repositories/messages.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { messageCreatePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class MessageCreateHandler implements OdlActionHandler {
  readonly action = 'message_create';
  private readonly logger = new Logger(MessageCreateHandler.name);

  constructor(
    private readonly channelsRepository: ChannelsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = messageCreatePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(`Invalid message_create payload: ${result.error.message}`);
      return;
    }

    const data = result.data;
    const createdAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    const messageId = buildOslMessageId(
      ctx.transactionId,
      ctx.transactionIndex,
      ctx.operationIndex,
      ctx.odlEventIndex,
    );

    if (await this.messagesRepository.tombstoneExists(messageId)) {
      this.logger.warn(
        `message_create: tombstone exists for '${messageId}'; skipping`,
      );
      return;
    }

    let channelId: string | undefined;

    if (data.peer !== undefined || data.members !== undefined) {
      const members = this.resolveDmMembers(data, ctx.creator);
      if (!members) {
        return;
      }
      channelId = await this.resolveOrCreateDmChannel(members, ctx, createdAtUnix);
      if (!channelId) {
        return;
      }
    } else if (data.channel_id !== undefined) {
      channelId = data.channel_id;
    } else {
      return;
    }

    const channel = await this.channelsRepository.findById(channelId);
    if (!channel) {
      this.logger.warn(
        `message_create: channel '${channelId}' not found; skipping`,
      );
      return;
    }

    if (channel.kind === CHANNEL_KINDS[2]) {
      // object channel: open write
    } else if (
      channel.kind === CHANNEL_KINDS[0] ||
      channel.kind === CHANNEL_KINDS[1]
    ) {
      const isMember = await this.channelsRepository.isMember(channelId, ctx.creator);
      if (!isMember) {
        this.logger.warn(
          `message_create: '${ctx.creator}' is not a member of '${channelId}'; skipping`,
        );
        return;
      }
    } else {
      this.logger.warn(`message_create: unknown channel kind; skipping`);
      return;
    }

    const existingMessage = await this.messagesRepository.findById(messageId);
    if (existingMessage) {
      return;
    }

    const mentions = data.mentions ?? [];

    await this.channelsRepository.runInTransaction(async (trx) => {
      await this.messagesRepository.insertMessage(
        {
          message_id: messageId,
          channel_id: channelId!,
          author: ctx.creator,
          body: data.body ?? null,
          overflow_ref: data.overflow_ref ?? null,
          encrypted_body: data.encrypted_body ?? null,
          encryption_mode: data.encryption?.mode ?? null,
          encrypted_to: data.encryption?.to ?? null,
          encryption_v: data.encryption?.v ?? null,
          encryption_meta: null,
          reply_to: data.reply_to ?? null,
          quote_json: (data.quote_json as JsonValue | undefined) ?? null,
          attachments: (data.attachments as JsonValue | undefined) ?? null,
          mentions,
          created_at_unix: createdAtUnix,
          event_seq: ctx.eventSeq,
          transaction_id: ctx.transactionId,
        },
        trx,
      );
      await this.channelsRepository.updateLastMessageAt(channelId!, createdAtUnix, trx);
    });
  }

  private resolveDmMembers(
    data: { peer?: string; members?: string[] },
    signer: string,
  ): [string, string] | null {
    if (data.peer !== undefined) {
      const peer = data.peer.trim();
      if (peer.length === 0 || peer === signer) {
        this.logger.warn('message_create: invalid peer for DM bootstrap; skipping');
        return null;
      }
      return [signer, peer];
    }

    const members = data.members!;
    const normalized = members.map((m) => m.trim());
    if (!normalized.includes(signer)) {
      this.logger.warn('message_create: signer must be in members; skipping');
      return null;
    }
    const other = normalized.find((m) => m !== signer);
    if (!other) {
      this.logger.warn('message_create: DM requires two distinct members; skipping');
      return null;
    }
    return [signer, other];
  }

  private async resolveOrCreateDmChannel(
    members: [string, string],
    ctx: OdlEventContext,
    createdAtUnix: number,
  ): Promise<string | undefined> {
    const pairHash = computeDmPairHash(members);
    const channelId = buildDmChannelId(pairHash);

    const existing =
      (await this.channelsRepository.findByPairHash(pairHash)) ??
      (await this.channelsRepository.findById(channelId));
    if (existing) {
      return existing.channel_id;
    }

    await this.channelsRepository.runInTransaction(async (trx) => {
      const again =
        (await this.channelsRepository.findByPairHash(pairHash, trx)) ??
        (await this.channelsRepository.findById(channelId, trx));
      if (again) {
        return;
      }

      await this.channelsRepository.insertChannel(
        {
          channel_id: channelId,
          kind: CHANNEL_KINDS[0],
          creator: ctx.creator,
          title: null,
          image: null,
          object_id: null,
          pair_hash: pairHash,
          access: CHANNEL_ACCESS[0],
          last_message_at_unix: createdAtUnix,
          created_at_unix: createdAtUnix,
          event_seq: ctx.eventSeq,
          transaction_id: ctx.transactionId,
        },
        trx,
      );

      for (const account of members) {
        await this.channelsRepository.insertMember(
          {
            channel_id: channelId,
            account,
            role: CHANNEL_MEMBER_ROLES[1],
            joined_at_unix: createdAtUnix,
          },
          trx,
        );
      }

      await this.channelsRepository.insertAlias(
        {
          alias: buildDmAlias(pairHash),
          channel_id: channelId,
          registered_by: ctx.creator,
          created_at_unix: createdAtUnix,
          event_seq: ctx.eventSeq,
        },
        trx,
      );
    });

    return channelId;
  }
}
