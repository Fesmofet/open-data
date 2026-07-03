import { Injectable } from '@nestjs/common';
import type { AggregatedObject } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AccountsCurrentRepository,
  AggregatedObjectRepository,
  UserObjectExpertiseRepository,
} from '../../repositories';
import { ObjectProjectionService } from '../object-projection';
import { EXPERTISE_CARD_UPDATE_TYPES } from './expertise.constants';
import type { UserExpertiseObjectsQuery } from './expertise.schema';
import type {
  ExpertiseProjectedObject,
  PaginatedExpertiseObjects,
} from './paginated-expertise-objects.types';

function orderAggregatedByIds(objects: AggregatedObject[], objectIds: string[]): AggregatedObject[] {
  const map = new Map(objects.map((o) => [o.core.object_id, o]));
  return objectIds.map((id) => map.get(id)).filter((o): o is AggregatedObject => o != null);
}

@Injectable()
export class GetUserExpertiseObjectsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly expertiseRepo: UserObjectExpertiseRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly objectProjection: ObjectProjectionService,
  ) {}

  async execute(
    username: string,
    query: UserExpertiseObjectsQuery,
    locale: string,
    governanceObjectIdFromHeader: string | undefined,
    viewerAccount: string | undefined,
  ): Promise<PaginatedExpertiseObjects | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const row = await this.accounts.findByName(name);
    if (!row) {
      return null;
    }

    const [total, expertiseRows] = await Promise.all([
      this.expertiseRepo.countByScope(name, query.scope),
      this.expertiseRepo.listByScope(name, query.scope, query.skip, query.limit),
    ]);

    const hasMore = expertiseRows.length > query.limit;
    const pageRows = hasMore ? expertiseRows.slice(0, query.limit) : expertiseRows;
    const objectIds = pageRows.map((r) => r.object_id);
    const weightById = new Map(pageRows.map((r) => [r.object_id, r.weight]));

    if (objectIds.length === 0) {
      return { items: [], total, hasMore: false };
    }

    const { objects, voterWaivPowers, rankVoteProjection } =
      await this.aggregatedObjectRepo.loadByObjectIds(objectIds, {
        viewerAccount,
      });
    const ordered = orderAggregatedByIds(objects, objectIds);

    const views = this.objectViewService.resolve(ordered, voterWaivPowers, {
      update_types: [...EXPERTISE_CARD_UPDATE_TYPES],
      locale,
      include_rejected: false,
    });

    const projected = await this.objectProjection.batchProject(views, {
      locale,
      includeSeo: false,
      governanceObjectIdFromHeader,
      viewerAccount,
      rankVoteProjection,
    });

    const items: ExpertiseProjectedObject[] = projected.map((p) => ({
      ...p,
      user_weight: weightById.get(p.object_id) ?? 0,
    }));

    return {
      items,
      total,
      hasMore,
    };
  }
}
