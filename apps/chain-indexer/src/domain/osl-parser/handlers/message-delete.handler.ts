import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  buildOslMessageId,
} from '@opden-data-layer/core';
import { MessagesRepository } from '../../../repositories/messages.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { messageDeletePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class MessageDeleteHandler implements OdlActionHandler {
  readonly action = 'message_delete';
  private readonly logger = new Logger(MessageDeleteHandler.name);

  constructor(private readonly messagesRepository: MessagesRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = messageDeletePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(`Invalid message_delete payload: ${result.error.message}`);
      return;
    }

    const { message_id, channel_id } = result.data;

    if (await this.messagesRepository.tombstoneExists(message_id)) {
      return;
    }

    const message = await this.messagesRepository.findById(message_id);
    if (!message || message.channel_id !== channel_id) {
      this.logger.warn(
        `message_delete: message '${message_id}' not found in channel; skipping`,
      );
      return;
    }

    if (message.author !== ctx.creator) {
      this.logger.warn(
        `message_delete: only author may delete '${message_id}'; skipping`,
      );
      return;
    }

    const deletedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.messagesRepository.deleteAndTombstone({
      message_id,
      channel_id,
      deleted_by: ctx.creator,
      deleted_at_unix: deletedAtUnix,
      event_seq: ctx.eventSeq,
      transaction_id: ctx.transactionId,
    });
  }
}
