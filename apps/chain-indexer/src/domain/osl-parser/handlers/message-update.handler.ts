import { Injectable, Logger } from '@nestjs/common';
import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';

import { MessagesRepository } from '../../../repositories/messages.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { messageUpdatePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class MessageUpdateHandler implements OdlActionHandler {
  readonly action = 'message_update';
  private readonly logger = new Logger(MessageUpdateHandler.name);

  constructor(private readonly messagesRepository: MessagesRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = messageUpdatePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(`Invalid message_update payload: ${result.error.message}`);
      return;
    }

    const { message_id, channel_id, body } = result.data;

    if (await this.messagesRepository.tombstoneExists(message_id)) {
      this.logger.warn(
        `message_update: tombstone exists for '${message_id}'; skipping`,
      );
      return;
    }

    const message = await this.messagesRepository.findById(message_id);
    if (!message || message.channel_id !== channel_id) {
      this.logger.warn(
        `message_update: message '${message_id}' not found in channel; skipping`,
      );
      return;
    }

    if (message.author !== ctx.creator) {
      this.logger.warn(
        `message_update: only author may edit '${message_id}'; skipping`,
      );
      return;
    }

    if (message.encrypted_body != null) {
      this.logger.warn(
        `message_update: encrypted messages cannot be edited '${message_id}'; skipping`,
      );
      return;
    }

    const updatedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.messagesRepository.updateBody({
      message_id,
      body,
      updated_at_unix: updatedAtUnix,
    });
  }
}
