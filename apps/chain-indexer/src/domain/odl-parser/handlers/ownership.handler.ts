import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ObjectsCoreRepository, ObjectOwnershipRepository } from '../../../repositories';
import type { OdlActionHandler, OdlEventContext } from '../odl-action-handler';
import { objectOwnershipPayloadSchema } from '../odl-envelope.schema';
import {
  OwnershipChangedEvent,
  OWNERSHIP_CHANGED_EVENT,
} from '../ownership-changed.event';

@Injectable()
export class OwnershipHandler implements OdlActionHandler {
  readonly action = 'object_ownership';
  private readonly logger = new Logger(OwnershipHandler.name);

  constructor(
    private readonly objectsCoreRepository: ObjectsCoreRepository,
    private readonly objectOwnershipRepository: ObjectOwnershipRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = objectOwnershipPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid object_ownership payload for action '${ctx.action}': ${result.error.message}`,
      );
      return;
    }

    const { object_id, method, ownership_type } = result.data;

    if (method === 'add') {
      const object = await this.objectsCoreRepository.findByObjectId(object_id);
      if (!object) {
        this.logger.warn(
          `object_ownership: object '${object_id}' not found; skipping add`,
        );
        return;
      }

      await this.objectOwnershipRepository.upsert({
        object_id,
        account: ctx.creator,
        ownership_type,
        event_seq: ctx.eventSeq,
        created_at: hiveBlockTimestampToDate(ctx.timestamp),
      });

      this.eventEmitter.emit(
        OWNERSHIP_CHANGED_EVENT,
        new OwnershipChangedEvent(ctx.creator, object_id),
      );
      return;
    }

    if (method === 'remove') {
      await this.objectOwnershipRepository.delete(object_id, ctx.creator);
      this.eventEmitter.emit(
        OWNERSHIP_CHANGED_EVENT,
        new OwnershipChangedEvent(ctx.creator, object_id),
      );
    }
  }
}
