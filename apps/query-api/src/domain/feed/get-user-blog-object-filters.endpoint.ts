import { Injectable } from '@nestjs/common';
import type { AggregatedObject } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AccountsCurrentRepository,
  AggregatedObjectRepository,
  PostsRepository,
} from '../../repositories';
import { ObjectProjectionService } from '../object-projection';
import type { UserBlogObjectFiltersQuery } from './schemas/user-blog-object-filters.schema';
import { USER_BLOG_OBJECT_FILTERS_MAX } from './schemas/user-blog-object-filters.schema';
import { projectedObjectDisplayName } from './user-blog-object-display-name';
import type { UserBlogObjectFiltersResponseDto } from './user-blog-object-filters.types';

function orderedUniqueObjectIds(objectIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of objectIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}

function orderAggregatedByIds(objects: AggregatedObject[], objectIds: string[]): AggregatedObject[] {
  const map = new Map(objects.map((o) => [o.core.object_id, o]));
  return objectIds.map((id) => map.get(id)).filter((o): o is AggregatedObject => o != null);
}

@Injectable()
export class GetUserBlogObjectFiltersEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly postsRepo: PostsRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly objectProjection: ObjectProjectionService,
  ) {}

  async execute(
    accountName: string,
    query: UserBlogObjectFiltersQuery,
    locale: string,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<UserBlogObjectFiltersResponseDto | null> {
    const name = accountName.trim();
    if (name.length === 0) {
      return null;
    }

    const row = await this.accounts.findByName(name);
    if (!row) {
      return null;
    }

    const activeObjectIds = orderedUniqueObjectIds(query.objects).slice(
      0,
      USER_BLOG_OBJECT_FILTERS_MAX,
    );
    const facetRows = await this.postsRepo.findUserBlogObjectFacets(name, activeObjectIds);
    if (facetRows.length === 0) {
      return { items: [] };
    }

    const objectIds = facetRows.map((r) => r.object_id);
    const countById = new Map(facetRows.map((r) => [r.object_id, r.post_count]));

    const { objects, voterWaivPowers, rankVoteProjection } =
      await this.aggregatedObjectRepo.loadByObjectIds(objectIds, {
        viewerAccount,
        includeRankVoteProjection: false,
      });
    const ordered = orderAggregatedByIds(objects, objectIds);
    const views = this.objectViewService.resolve(ordered, voterWaivPowers, {
      update_types: ['name'],
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
    const nameById = new Map(projected.map((p) => [p.object_id, projectedObjectDisplayName(p)]));

    return {
      items: facetRows.map((row) => ({
        object_id: row.object_id,
        name: nameById.get(row.object_id) ?? row.object_id,
        count: row.post_count,
      })),
    };
  }
}
