import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  CHANNEL_KINDS,
  CHANNEL_MEMBER_ROLES,
} from '@opden-data-layer/core';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import { MessagesRepository } from '../../../repositories/messages.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelLeavePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelLeaveHandler implements OdlActionHandler {
  readonly action = 'channel_leave';
  private readonly logger = new Logger(ChannelLeaveHandler.name);

  constructor(
    private readonly channelsRepository: ChannelsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelLeavePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(`Invalid channel_leave payload: ${result.error.message}`);
      return;
    }

    const { channel_id, successor_admin, delete_my_messages: deleteMyMessages } =
      result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel) {
      this.logger.warn(`channel_leave: channel '${channel_id}' not found; skipping`);
      return;
    }

    if (channel.kind === CHANNEL_KINDS[0]) {
      this.logger.warn(
        `channel_leave: direct channel '${channel_id}' members are immutable; skipping`,
      );
      return;
    }

    if (channel.kind !== CHANNEL_KINDS[1]) {
      this.logger.warn(`channel_leave: not a group channel '${channel_id}'; skipping`);
      return;
    }

    if (channel.dissolved_at_unix != null) {
      this.logger.warn(`channel_leave: channel '${channel_id}' is dissolved; skipping`);
      return;
    }

    const signerRole = await this.channelsRepository.getMemberRole(channel_id, ctx.creator);
    if (!signerRole) {
      this.logger.warn(
        `channel_leave: '${ctx.creator}' is not a member of '${channel_id}'; skipping`,
      );
      return;
    }

    const memberCount = await this.channelsRepository.countMembers(channel_id);
    const adminCount = await this.channelsRepository.countAdmins(channel_id);
    const isAdmin = signerRole === CHANNEL_MEMBER_ROLES[0];
    const isSoleAdmin = isAdmin && adminCount === 1;
    const isLastMember = memberCount === 1;

    if (isSoleAdmin && memberCount > 1) {
      const successor = successor_admin?.trim();
      if (!successor || successor === ctx.creator) {
        this.logger.warn(
          `channel_leave: sole admin '${ctx.creator}' must provide successor for '${channel_id}'; skipping`,
        );
        return;
      }
      const successorIsMember = await this.channelsRepository.isMember(channel_id, successor);
      if (!successorIsMember) {
        this.logger.warn(
          `channel_leave: successor '${successor}' is not a member of '${channel_id}'; skipping`,
        );
        return;
      }
    }

    const deletedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);

    await this.channelsRepository.runInTransaction(async (trx) => {
      if (isSoleAdmin && memberCount > 1 && successor_admin) {
        await this.channelsRepository.updateMemberRole(
          channel_id,
          successor_admin,
          CHANNEL_MEMBER_ROLES[0],
          trx,
        );
      }

      if (deleteMyMessages === true) {
        await this.messagesRepository.deleteAllByAuthorInChannel(
          {
            channelId: channel_id,
            author: ctx.creator,
            deletedBy: ctx.creator,
            deletedAtUnix,
            eventSeq: ctx.eventSeq,
            transactionId: ctx.transactionId,
          },
          trx,
        );
      }

      await this.channelsRepository.removeMember(channel_id, ctx.creator, trx);

      if (isLastMember) {
        await this.channelsRepository.dissolveChannel(channel_id, deletedAtUnix, trx);
      }
    });
  }
}
