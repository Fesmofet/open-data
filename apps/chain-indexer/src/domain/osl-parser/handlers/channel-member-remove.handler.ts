import { Injectable, Logger } from '@nestjs/common';
import { CHANNEL_KINDS, CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelMemberPayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelMemberRemoveHandler implements OdlActionHandler {
  readonly action = 'channel_member_remove';
  private readonly logger = new Logger(ChannelMemberRemoveHandler.name);

  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelMemberPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid channel_member_remove payload: ${result.error.message}`,
      );
      return;
    }

    const { channel_id, account } = result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel) {
      this.logger.warn(
        `channel_member_remove: channel '${channel_id}' not found; skipping`,
      );
      return;
    }

    if (channel.kind === CHANNEL_KINDS[0]) {
      this.logger.warn(
        `channel_member_remove: direct channel '${channel_id}' members are immutable; skipping`,
      );
      return;
    }

    if (channel.kind !== CHANNEL_KINDS[1]) {
      this.logger.warn(
        `channel_member_remove: not a group channel '${channel_id}'; skipping`,
      );
      return;
    }

    const actorRole = await this.channelsRepository.getMemberRole(channel_id, ctx.creator);
    if (actorRole !== CHANNEL_MEMBER_ROLES[0]) {
      this.logger.warn(
        `channel_member_remove: '${ctx.creator}' is not admin of '${channel_id}'; skipping`,
      );
      return;
    }

    const targetRole = await this.channelsRepository.getMemberRole(channel_id, account);
    if (!targetRole) {
      return;
    }

    if (targetRole === CHANNEL_MEMBER_ROLES[0]) {
      const adminCount = await this.channelsRepository.countAdmins(channel_id);
      if (adminCount <= 1) {
        this.logger.warn(
          `channel_member_remove: cannot remove last admin from '${channel_id}'; skipping`,
        );
        return;
      }
    }

    await this.channelsRepository.removeMember(channel_id, account);
  }
}
