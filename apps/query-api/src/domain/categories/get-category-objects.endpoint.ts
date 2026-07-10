import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  ObjectAuthorityRepository,
  ObjectCategoriesRepository,
} from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { expandObjectRefs } from '../object-projection/object-ref-expansion';
import { ListItemsRecursiveCountService } from '../object-projection/list-items-recursive-count.service';
import type { RefSummary } from '../object-projection/projected-object.types';
import {
  decodeCategoryObjectsCursor,
  encodeCategoryObjectsCursor,
} from './category-objects-cursor';
import type { CategoryObjectsQuery } from './category-objects-query.schema';
import type { ObjectRefListResponseDto } from '../objects/schemas/object-ref-list.schema';

export interface GetCategoryObjectsInput {
  query: CategoryObjectsQuery;
  locale: string;
  governanceObjectIdFromHeader?: string;
  viewerAccount?: string;
}

@Injectable()
export class GetCategoryObjectsEndpoint {
  constructor(
    private readonly objectCategoriesRepo: ObjectCategoriesRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly objectAuthorityRepo: ObjectAuthorityRepository,
    private readonly listItemsRecursiveCountService: ListItemsRecursiveCountService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: GetCategoryObjectsInput): Promise<ObjectRefListResponseDto> {
    const categoryName = input.query.name.trim();
    if (categoryName.length === 0) {
      return { items: [], hasMore: false, cursor: null };
    }

    const cursor = input.query.cursor
      ? decodeCategoryObjectsCursor(input.query.cursor)
      : null;
    const excludeObjectId = input.query.exclude_object_id?.trim() || undefined;

    const { rows, hasMore } = await this.objectCategoriesRepo.findObjectIdsByCategoryName({
      categoryName,
      limit: input.query.limit,
      cursor,
      excludeObjectId,
    });

    if (rows.length === 0) {
      return { items: [], hasMore: false, cursor: null };
    }

    const pageIds = rows.map((r) => r.object_id);
    const viewer = input.viewerAccount?.trim() || undefined;
    let viewerAdminIds: Set<string> | undefined;
    if (viewer) {
      const refAdminIds = await this.objectAuthorityRepo.findAdministrativeObjectIdsForAccount(
        viewer,
        pageIds,
      );
      viewerAdminIds = new Set(refAdminIds);
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView(
      input.governanceObjectIdFromHeader,
    );
    const contentBaseUrl = this.config.get<string | undefined>('ipfs.contentBaseUrl');
    const refSummariesById = await expandObjectRefs(pageIds, {
      aggregatedObjectRepo: this.aggregatedObjectRepo,
      objectViewService: this.objectViewService,
      listItemsRecursiveCountService: this.listItemsRecursiveCountService,
      parentObjectId: excludeObjectId,
      governance,
      locale: input.locale,
      contentBaseUrl,
      viewerAccount: viewer,
      viewerAdminIds,
    });

    const items: RefSummary[] = [];
    for (const refId of pageIds) {
      const summary = refSummariesById.get(refId);
      if (summary) {
        items.push(summary);
      }
    }

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow != null
        ? encodeCategoryObjectsCursor({
            weight: lastRow.weight,
            object_id: lastRow.object_id,
          })
        : null;

    return { items, hasMore, cursor: nextCursor };
  }
}
