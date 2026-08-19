import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  CHANNEL_KINDS,
  CHANNEL_MEMBER_ROLES,
} from '@opden-data-layer/core';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelMemberPayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelMemberAddHandler implements OdlActionHandler {
  readonly action = 'channel_member_add';
  private readonly logger = new Logger(ChannelMemberAddHandler.name);

  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelMemberPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid channel_member_add payload: ${result.error.message}`,
      );
      return;
    }

    const { channel_id, account } = result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel || channel.kind !== CHANNEL_KINDS[1]) {
      this.logger.warn(
        `channel_member_add: group channel '${channel_id}' not found; skipping`,
      );
      return;
    }

    const role = await this.channelsRepository.getMemberRole(channel_id, ctx.creator);
    if (role !== CHANNEL_MEMBER_ROLES[0]) {
      this.logger.warn(
        `channel_member_add: '${ctx.creator}' is not admin of '${channel_id}'; skipping`,
      );
      return;
    }

    const joinedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.channelsRepository.insertMember({
      channel_id,
      account,
      role: CHANNEL_MEMBER_ROLES[1],
      joined_at_unix: joinedAtUnix,
    });
  }
}
