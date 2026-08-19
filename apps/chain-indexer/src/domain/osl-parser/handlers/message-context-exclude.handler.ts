import { Injectable, Logger } from '@nestjs/common';
import { blockTimestampToUnixSeconds } from '@opden-data-layer/core';
import { MessagesRepository } from '../../../repositories/messages.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { messageContextExcludePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class MessageContextExcludeHandler implements OdlActionHandler {
  readonly action = 'message_context_exclude';
  private readonly logger = new Logger(MessageContextExcludeHandler.name);

  constructor(private readonly messagesRepository: MessagesRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = messageContextExcludePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid message_context_exclude payload: ${result.error.message}`,
      );
      return;
    }

    const { message_id } = result.data;
    const message = await this.messagesRepository.findById(message_id);
    if (!message) {
      this.logger.warn(
        `message_context_exclude: message '${message_id}' not found; skipping`,
      );
      return;
    }

    if (message.author !== ctx.creator) {
      this.logger.warn(
        `message_context_exclude: only author may exclude '${message_id}'; skipping`,
      );
      return;
    }

    const excludedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.messagesRepository.upsertContextExclusion({
      message_id,
      excluded_by: ctx.creator,
      excluded_at_unix: excludedAtUnix,
      event_seq: ctx.eventSeq,
    });
  }
}
