import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  CHANNEL_KINDS,
  extractObjectIdsFromCommentBody,
  resolveMessageLinkedObjectIds,
} from '@opden-data-layer/core';

import { ChannelsRepository } from '../../../repositories/channels.repository';
import { MessagesRepository } from '../../../repositories/messages.repository';
import { ObjectsCoreRepository } from '../../../repositories/objects-core.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { messageUpdatePayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class MessageUpdateHandler implements OdlActionHandler {
  readonly action = 'message_update';
  private readonly logger = new Logger(MessageUpdateHandler.name);

  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly channelsRepository: ChannelsRepository,
    private readonly objectsCoreRepository: ObjectsCoreRepository,
  ) {}

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

    const channel = await this.channelsRepository.findById(channel_id);
    const linkedObjectIds = await this.resolveLinkedObjectIdsForChannel(
      channel?.kind,
      channel?.object_id ?? null,
      body,
    );

    const updatedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.messagesRepository.updateBody({
      message_id,
      body,
      updated_at_unix: updatedAtUnix,
      linked_object_ids: linkedObjectIds,
    });
  }

  private async resolveLinkedObjectIdsForChannel(
    channelKind: string | undefined,
    nativeObjectId: string | null,
    body: string,
  ): Promise<string[]> {
    if (channelKind !== CHANNEL_KINDS[2]) {
      return [];
    }

    const candidates = extractObjectIdsFromCommentBody(body);
    if (candidates.length === 0) {
      return [];
    }

    const types = await this.objectsCoreRepository.findObjectTypesByIds(candidates);
    return resolveMessageLinkedObjectIds({
      body,
      nativeObjectId,
      existingObjectIds: [...types.keys()],
    });
  }
}
