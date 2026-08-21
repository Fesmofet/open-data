import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ObjectsCoreRepository,
  ObjectFavoriteRepository,
} from '../../../repositories';
import { UserShopDeselectRepository } from '../../../repositories/user-shop-deselect.repository';
import type { OdlActionHandler, OdlEventContext } from '../odl-action-handler';
import { objectFavoritePayloadSchema } from '../odl-envelope.schema';
import {
  ObjectFavoriteChangedEvent,
  OBJECT_FAVORITE_CHANGED_EVENT,
} from '../object-favorite-changed.event';
import { ObjectFavoriteReputationService } from '../object-favorite-reputation.service';

@Injectable()
export class FavoriteHandler implements OdlActionHandler {
  readonly action = 'object_favorite';
  private readonly logger = new Logger(FavoriteHandler.name);

  constructor(
    private readonly objectsCoreRepository: ObjectsCoreRepository,
    private readonly objectFavoriteRepository: ObjectFavoriteRepository,
    private readonly userShopDeselectRepository: UserShopDeselectRepository,
    private readonly objectFavoriteReputationService: ObjectFavoriteReputationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = objectFavoritePayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid object_favorite payload for action '${ctx.action}': ${result.error.message}`,
      );
      return;
    }

    const { object_id, method } = result.data;

    if (method === 'add') {
      const object = await this.objectsCoreRepository.findByObjectId(object_id);
      if (!object) {
        this.logger.warn(
          `object_favorite: object '${object_id}' not found; skipping add`,
        );
        return;
      }

      await this.userShopDeselectRepository.remove(ctx.creator, object_id);

      await this.objectFavoriteReputationService.onFavoriteAdded(
        object_id,
        ctx.creator,
        object.creator,
      );

      await this.objectFavoriteRepository.upsert({
        object_id,
        account: ctx.creator,
        event_seq: ctx.eventSeq,
        created_at: hiveBlockTimestampToDate(ctx.timestamp),
      });

      this.eventEmitter.emit(
        OBJECT_FAVORITE_CHANGED_EVENT,
        new ObjectFavoriteChangedEvent(ctx.creator),
      );
      return;
    }

    if (method === 'remove') {
      const object = await this.objectsCoreRepository.findByObjectId(object_id);
      if (object) {
        await this.objectFavoriteReputationService.onFavoriteRemoved(
          object_id,
          ctx.creator,
          object.creator,
        );
      }

      await this.objectFavoriteRepository.delete(object_id, ctx.creator);
      this.eventEmitter.emit(
        OBJECT_FAVORITE_CHANGED_EVENT,
        new ObjectFavoriteChangedEvent(ctx.creator),
      );
    }
  }
}
