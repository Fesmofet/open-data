import { Injectable, Logger } from '@nestjs/common';
import { CHANNEL_KINDS, CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelUpdatePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelUpdateHandler implements OdlActionHandler {
  readonly action = 'channel_update';
  private readonly logger = new Logger(ChannelUpdateHandler.name);

  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelUpdatePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(`Invalid channel_update payload: ${result.error.message}`);
      return;
    }

    const { channel_id, title, image } = result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel) {
      this.logger.warn(`channel_update: channel '${channel_id}' not found; skipping`);
      return;
    }

    if (channel.kind === CHANNEL_KINDS[0]) {
      this.logger.warn(
        `channel_update: direct channel '${channel_id}' cannot be updated; skipping`,
      );
      return;
    }

    if (channel.kind !== CHANNEL_KINDS[1]) {
      this.logger.warn(
        `channel_update: only group channels support update in v1; skipping`,
      );
      return;
    }

    const role = await this.channelsRepository.getMemberRole(channel_id, ctx.creator);
    if (role !== CHANNEL_MEMBER_ROLES[0]) {
      this.logger.warn(
        `channel_update: '${ctx.creator}' is not admin of '${channel_id}'; skipping`,
      );
      return;
    }

    await this.channelsRepository.updateGroupMeta(channel_id, {
      title,
      image,
    });
  }
}
