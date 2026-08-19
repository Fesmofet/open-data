import { Injectable, Logger } from '@nestjs/common';
import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { channelAliasRegisterPayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelAliasRegisterHandler implements OdlActionHandler {
  readonly action = 'channel_alias_register';
  private readonly logger = new Logger(ChannelAliasRegisterHandler.name);

  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelAliasRegisterPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid channel_alias_register payload: ${result.error.message}`,
      );
      return;
    }

    const { alias, channel_id } = result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel) {
      this.logger.warn(
        `channel_alias_register: channel '${channel_id}' not found; skipping`,
      );
      return;
    }

    const existing = await this.channelsRepository.findAlias(alias);
    if (existing) {
      if (existing.channel_id === channel_id) {
        return;
      }
      this.logger.warn(
        `channel_alias_register: alias '${alias}' already maps to '${existing.channel_id}'; skipping`,
      );
      return;
    }

    const createdAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.channelsRepository.insertAlias({
      alias,
      channel_id,
      registered_by: ctx.creator,
      created_at_unix: createdAtUnix,
      event_seq: ctx.eventSeq,
    });
  }
}
