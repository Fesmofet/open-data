import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  buildObjectChannelAlias,
  CHANNEL_ACCESS,
  CHANNEL_KINDS,
  CHANNEL_MEMBER_ROLES,
} from '@opden-data-layer/core';
import { ObjectsCoreRepository } from '../../../repositories';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelCreatePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelCreateHandler implements OdlActionHandler {
  readonly action = 'channel_create';
  private readonly logger = new Logger(ChannelCreateHandler.name);

  constructor(
    private readonly channelsRepository: ChannelsRepository,
    private readonly objectsCoreRepository: ObjectsCoreRepository,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelCreatePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid channel_create payload: ${result.error.message}`,
      );
      return;
    }

    const data = result.data;
    const createdAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);

    const existing = await this.channelsRepository.findById(data.channel_id);
    if (existing) {
      this.logger.warn(
        `channel_create: channel '${data.channel_id}' already exists; skipping`,
      );
      return;
    }

    if (data.kind === 'object') {
      const object = await this.objectsCoreRepository.findByObjectId(data.object_id);
      if (!object) {
        this.logger.warn(
          `channel_create: object '${data.object_id}' not found; skipping`,
        );
        return;
      }

      const existingObjectChannel = await this.channelsRepository.findByObjectId(
        data.object_id,
      );
      if (existingObjectChannel) {
        this.logger.warn(
          `channel_create: object channel for '${data.object_id}' already exists; skipping`,
        );
        return;
      }

      await this.channelsRepository.runInTransaction(async (trx) => {
        await this.channelsRepository.insertChannel(
          {
            channel_id: data.channel_id,
            kind: CHANNEL_KINDS[2],
            creator: ctx.creator,
            title: data.title ?? null,
            image: data.image ?? null,
            object_id: data.object_id,
            pair_hash: null,
            access: CHANNEL_ACCESS[1],
            last_message_at_unix: null,
            created_at_unix: createdAtUnix,
            event_seq: ctx.eventSeq,
            transaction_id: ctx.transactionId,
          },
          trx,
        );
        await this.channelsRepository.insertAlias(
          {
            alias: buildObjectChannelAlias(data.object_id),
            channel_id: data.channel_id,
            registered_by: ctx.creator,
            created_at_unix: createdAtUnix,
            event_seq: ctx.eventSeq,
          },
          trx,
        );
      });
      return;
    }

    const members = data.members ?? [];
    const memberSet = new Set(members);
    memberSet.add(ctx.creator);

    await this.channelsRepository.runInTransaction(async (trx) => {
      await this.channelsRepository.insertChannel(
        {
          channel_id: data.channel_id,
          kind: CHANNEL_KINDS[1],
          creator: ctx.creator,
          title: data.title ?? null,
          image: data.image ?? null,
          object_id: null,
          pair_hash: null,
          access: CHANNEL_ACCESS[0],
          last_message_at_unix: null,
          created_at_unix: createdAtUnix,
          event_seq: ctx.eventSeq,
          transaction_id: ctx.transactionId,
        },
        trx,
      );

      await this.channelsRepository.insertMember(
        {
          channel_id: data.channel_id,
          account: ctx.creator,
          role: CHANNEL_MEMBER_ROLES[0],
          joined_at_unix: createdAtUnix,
        },
        trx,
      );

      for (const account of memberSet) {
        if (account === ctx.creator) {
          continue;
        }
        await this.channelsRepository.insertMember(
          {
            channel_id: data.channel_id,
            account,
            role: CHANNEL_MEMBER_ROLES[1],
            joined_at_unix: createdAtUnix,
          },
          trx,
        );
      }
    });
  }
}
