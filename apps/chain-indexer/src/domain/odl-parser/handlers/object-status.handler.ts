import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  materializeObjectCoreStatus,
  ObjectViewService,
} from '@opden-data-layer/objects-domain';
import { GovernanceCacheService } from '../../governance/governance-cache.service';
import {
  AggregatedObjectRepository,
  ObjectTagCategoriesSyncQueueRepository,
  ObjectsCoreRepository,
} from '../../../repositories';
import {
  OBJECT_STATUS_RECOMPUTE_EVENT,
  ObjectStatusRecomputeEvent,
} from '../object-status-created.event';

@Injectable()
export class ObjectStatusHandler {
  private readonly logger = new Logger(ObjectStatusHandler.name);

  constructor(
    private readonly governanceCacheService: GovernanceCacheService,
    private readonly aggregatedObjectRepository: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly objectsCoreRepository: ObjectsCoreRepository,
    private readonly objectTagCategoriesSyncQueueRepository: ObjectTagCategoriesSyncQueueRepository,
  ) {}

  @OnEvent(OBJECT_STATUS_RECOMPUTE_EVENT)
  async handleObjectStatusRecompute(event: ObjectStatusRecomputeEvent): Promise<void> {
    const objectId = event.objectId.trim();
    if (objectId.length === 0) {
      return;
    }

    const { objects, voterWaivPowers } =
      await this.aggregatedObjectRepository.loadByObjectIds([objectId]);
    const aggregated = objects[0];
    if (!aggregated) {
      this.logger.warn(
        `object status recompute: object '${objectId}' not found; skipping`,
      );
      return;
    }

    const governance = await this.governanceCacheService.resolvePlatform();
    const nextStatus = materializeObjectCoreStatus(
      aggregated,
      voterWaivPowers,
      governance,
      this.objectViewService,
    );

    const previousStatus = aggregated.core.status;
    if (previousStatus === nextStatus) {
      return;
    }

    await this.objectsCoreRepository.update(objectId, { status: nextStatus });

    const wasActive = previousStatus === 'active';
    const isActive = nextStatus === 'active';
    if (wasActive !== isActive) {
      try {
        await this.objectTagCategoriesSyncQueueRepository.enqueue(
          objectId,
          Math.floor(Date.now() / 1000),
        );
      } catch (error) {
        this.logger.error(
          `object status recompute: tag category enqueue failed for '${objectId}': ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}
