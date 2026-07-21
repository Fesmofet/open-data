import { Injectable } from '@nestjs/common';
import { OBJECT_TYPE_REGISTRY, UPDATE_TYPES } from '@opden-data-layer/core';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  ObjectsCoreRepository,
} from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { ObjectProjectionService } from '../object-projection/object-projection.service';
import { emptyRankVoteProjection } from '../object-projection/projected-object.types';
import {
  aggregateObjectOptions,
  emptyObjectOptionsResponse,
  parseOptionRowsFromFields,
  readProjectedImageUrl,
  readProjectedPrice,
} from './object-options-aggregator';
import type { ObjectOptionsResponseDto } from './schemas/object-options.schema';

const OPTION_PROJECTION_TYPES = [
  UPDATE_TYPES.OPTION,
  UPDATE_TYPES.PRICE,
  UPDATE_TYPES.IMAGE,
] as const;

/** Max siblings loaded for variant options (requested object + up to cap − 1 others). */
export const OPTIONS_SIBLING_CAP = 128;

export function objectTypeSupportsOptions(objectType: string): boolean {
  const def = OBJECT_TYPE_REGISTRY[objectType];
  if (!def) {
    return false;
  }
  return def.supported_updates.includes(UPDATE_TYPES.OPTION);
}

@Injectable()
export class GetObjectOptionsEndpoint {
  constructor(
    private readonly objectsCore: ObjectsCoreRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly objectProjectionService: ObjectProjectionService,
  ) {}

  async execute(
    objectId: string,
    locale: string,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<ObjectOptionsResponseDto | null> {
    const id = objectId.trim();
    if (id.length === 0) {
      return null;
    }

    const core = await this.objectsCore.findByObjectIdForPage(id);
    if (!core) {
      return null;
    }

    if (!objectTypeSupportsOptions(core.object_type)) {
      return emptyObjectOptionsResponse(id);
    }

    const metaGroupId = core.meta_group_id?.trim() || null;
    const otherSiblingLimit = OPTIONS_SIBLING_CAP - 1;
    const otherIds = metaGroupId
      ? await this.objectsCore.findObjectIdsByMetaGroupId(metaGroupId, id, otherSiblingLimit)
      : [];
    const siblingIds = [id, ...otherIds];

    const { objects, voterWaivPowers } = await this.aggregatedObjectRepo.loadByObjectIds(
      siblingIds,
      {
        viewerAccount,
        includeRankVoteProjection: false,
      },
    );

    if (objects.length === 0) {
      return emptyObjectOptionsResponse(id);
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView(
      governanceObjectIdFromHeader,
    );

    const views = this.objectViewService.resolve(objects, voterWaivPowers, {
      update_types: [...OPTION_PROJECTION_TYPES],
      locale,
      include_rejected: false,
      governance,
    });

    const projected = await this.objectProjectionService.batchProject(views, {
      locale,
      governanceObjectIdFromHeader,
      governance,
      viewerAccount,
      rankVoteProjection: emptyRankVoteProjection(),
    });

    const projectedById = new Map(projected.map((item) => [item.object_id, item]));
    const siblings = siblingIds
      .map((siblingId) => projectedById.get(siblingId))
      .filter((item): item is NonNullable<typeof item> => item != null)
      .map((item) => ({
        object_id: item.object_id,
        optionRows: parseOptionRowsFromFields(item.fields),
        price: readProjectedPrice(item.fields),
        imageUrl: readProjectedImageUrl(item.fields),
      }));

    return aggregateObjectOptions(id, siblings);
  }
}
