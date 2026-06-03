import { Injectable } from '@nestjs/common';
import { ObjectViewService } from '@opden-data-layer/objects-domain';

import { AggregatedObjectRepository } from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { ObjectProjectionService } from '../object-projection/object-projection.service';
import {
  mapProjectedToSearchObject,
  SEARCH_OBJECT_DISPLAY_UPDATE_TYPES,
} from './search-object-result.mapper';
import type { SearchObjectResult } from './search.types';

export type SearchObjectsDisplayInput = {
  locale: string;
  viewerAccount?: string;
  governanceObjectIdFromHeader?: string;
};

@Injectable()
export class SearchObjectsDisplayService {
  constructor(
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly objectProjectionService: ObjectProjectionService,
  ) {}

  /**
   * Loads and projects objects by primary key (`object_id`), preserving `objectIds` order.
   * Missing or inactive ids are omitted.
   */
  async projectByObjectIds(
    objectIds: readonly string[],
    input: SearchObjectsDisplayInput,
  ): Promise<SearchObjectResult[]> {
    if (objectIds.length === 0) {
      return [];
    }

    const { objects, voterWaivPowers, rankVoteProjection } =
      await this.aggregatedObjectRepo.loadByObjectIds([...objectIds], {
        viewerAccount: input.viewerAccount,
        includeRankVoteProjection: false,
      });

    const byId = new Map(objects.map((o) => [o.core.object_id, o]));
    const ordered = objectIds
      .map((id) => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => x != null);

    if (ordered.length === 0) {
      return [];
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView(
      input.governanceObjectIdFromHeader,
    );

    const views = this.objectViewService.resolve(ordered, voterWaivPowers, {
      update_types: [...SEARCH_OBJECT_DISPLAY_UPDATE_TYPES],
      locale: input.locale,
      include_rejected: false,
      governance,
    });

    const projected = await this.objectProjectionService.batchProject(views, {
      locale: input.locale,
      includeSeo: false,
      governanceObjectIdFromHeader: input.governanceObjectIdFromHeader,
      viewerAccount: input.viewerAccount,
      rankVoteProjection,
    });

    return projected.map(mapProjectedToSearchObject);
  }
}
