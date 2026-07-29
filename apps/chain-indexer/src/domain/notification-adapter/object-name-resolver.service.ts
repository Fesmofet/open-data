import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisClientFactory } from '@opden-data-layer/clients';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  OBJECT_NAME_CACHE_TTL_SECONDS,
  OBJECT_NAME_RESOLVE_LOCALE,
} from '../../constants/object-name-cache.constants';
import { redisKey } from '../../constants/redis-keys';
import { AggregatedObjectRepository } from '../../repositories';
import { GovernanceCacheService } from '../governance/governance-cache.service';
import {
  GOVERNANCE_OBJECT_MUTATED_EVENT,
  GovernanceObjectMutatedEvent,
} from '../governance/governance-object-mutated.event';

@Injectable()
export class ObjectNameResolverService {
  private readonly logger = new Logger(ObjectNameResolverService.name);

  constructor(
    private readonly aggregatedObjectRepository: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceCacheService: GovernanceCacheService,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async resolve(objectId: string): Promise<string | null> {
    const trimmed = objectId.trim();
    if (trimmed.length === 0) {
      return null;
    }

    try {
      const redis = this.redisFactory.getClient(0);
      const key = redisKey.objectName(trimmed);
      const cached = await redis.get(key);
      if (cached !== null) {
        const text = cached.trim();
        return text.length > 0 ? text : null;
      }

      const name = await this.resolveFromDb(trimmed);
      await redis.set(key, name ?? '', OBJECT_NAME_CACHE_TTL_SECONDS);
      return name;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async invalidate(objectId: string): Promise<void> {
    const trimmed = objectId.trim();
    if (trimmed.length === 0) {
      return;
    }
    try {
      const redis = this.redisFactory.getClient(0);
      await redis.del(redisKey.objectName(trimmed));
    } catch (e) {
      this.logger.error((e as Error).message);
    }
  }

  @OnEvent(GOVERNANCE_OBJECT_MUTATED_EVENT)
  async handleObjectMutated(event: GovernanceObjectMutatedEvent): Promise<void> {
    await this.invalidate(event.objectId);
  }

  private async resolveFromDb(objectId: string): Promise<string | null> {
    const { objects, voterWaivPowers } =
      await this.aggregatedObjectRepository.loadByObjectIds([objectId]);
    const aggregated = objects[0];
    if (!aggregated) {
      return null;
    }
    const governance = await this.governanceCacheService.resolve(objectId);
    const views = this.objectViewService.resolve([aggregated], voterWaivPowers, {
      update_types: [UPDATE_TYPES.NAME],
      governance,
      locale: OBJECT_NAME_RESOLVE_LOCALE,
    });
    const winning = views[0]?.fields[UPDATE_TYPES.NAME]?.values[0];
    if (!winning || winning.validity_status !== 'VALID') {
      return null;
    }
    const text = winning.value_text?.trim() ?? '';
    return text.length > 0 ? text : null;
  }
}
