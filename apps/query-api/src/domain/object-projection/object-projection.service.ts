import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import type { GovernanceSnapshot } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  ObjectFavoriteRepository,
  ObjectOwnershipRepository,
} from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { expandObjectRefsWithCache } from './expand-object-refs-cached';
import { ListItemsRecursiveCountService } from './list-items-recursive-count.service';
import { normalizeProjectedObjectForJson } from './normalize-projected-object-for-json';
import { collectObjectRefIdsFromView, projectObjectCore } from './project-object';
import { ObjectSeoService } from './object-seo.service';
import type { ProjectedObject, RankVoteProjection } from './projected-object.types';

export interface ProjectOptions {
  locale: string;
  /** When true, adds `seo` via {@link ObjectSeoService}. Default false. */
  includeSeo?: boolean;
  /** Optional `X-Governance-Object-Id` merge for governance resolution. */
  governanceObjectIdFromHeader?: string;
  /** Pre-resolved governance snapshot; skips duplicate resolve when provided. */
  governance?: GovernanceSnapshot;
  /**
   * Current viewer (e.g. from `X-Viewer`). Used for `isFavorited`, ownership flags,
   * and `aggregateRating` per-aspect `userRating`.
   */
  viewerAccount?: string;
  /**
   * Vote counts / viewer ranks for `aggregateRating` from {@link AggregatedObjectRepository.loadByObjectIds}.
   */
  rankVoteProjection: RankVoteProjection;
}

export interface BatchProjectOptions {
  locale: string;
  /** When true, adds `seo` per item via {@link ObjectSeoService}. Default false. */
  includeSeo?: boolean;
  governanceObjectIdFromHeader?: string;
  governance?: GovernanceSnapshot;
  viewerAccount?: string;
  /** Same batch as the views (from one `loadByObjectIds`). */
  rankVoteProjection: RankVoteProjection;
}

@Injectable()
export class ObjectProjectionService {
  private readonly logger = new Logger(ObjectProjectionService.name);

  constructor(
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectFavoriteRepo: ObjectFavoriteRepository,
    private readonly objectOwnershipRepo: ObjectOwnershipRepository,
    private readonly listItemsRecursiveCountService: ListItemsRecursiveCountService,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly seoService: ObjectSeoService,
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
  ) {}

  async project(view: ResolvedObjectView, options: ProjectOptions): Promise<ProjectedObject> {
    const contentBaseUrl = this.config.get<string | undefined>('ipfs.contentBaseUrl');
    const viewerAccount = options.viewerAccount?.trim() || undefined;
    const governance =
      options.governance ??
      (await this.governanceResolver.resolveMergedForObjectView(
        options.governanceObjectIdFromHeader,
      ));

    let isFavorited = false;
    let hasSupervisedOwnership = false;
    let hasExclusiveOwnership = false;
    let hasOwnershipAuthority = false;
    let viewerFavoriteIds: Set<string> | undefined;
    if (viewerAccount) {
      const [favoriteIds, supervisedIds, exclusiveIds] = await Promise.all([
        this.objectFavoriteRepo.findFavoriteObjectIdsForAccount(viewerAccount, [view.object_id]),
        this.objectOwnershipRepo.findOwnershipObjectIdsForAccountByType(
          viewerAccount,
          [view.object_id],
          'supervised',
        ),
        this.objectOwnershipRepo.findOwnershipObjectIdsForAccountByType(
          viewerAccount,
          [view.object_id],
          'exclusive',
        ),
      ]);
      isFavorited = favoriteIds.includes(view.object_id);
      hasSupervisedOwnership = supervisedIds.includes(view.object_id);
      hasExclusiveOwnership = exclusiveIds.includes(view.object_id);
      hasOwnershipAuthority = hasSupervisedOwnership || hasExclusiveOwnership;
      viewerFavoriteIds = new Set(favoriteIds);
    }

    const refIds = collectObjectRefIdsFromView(view);
    if (viewerAccount && refIds.length > 0) {
      const refFavoriteIds = await this.objectFavoriteRepo.findFavoriteObjectIdsForAccount(
        viewerAccount,
        refIds,
      );
      viewerFavoriteIds = new Set([...(viewerFavoriteIds ?? []), ...refFavoriteIds]);
    }

    const refSummariesById = await expandObjectRefsWithCache(
      refIds,
      {
        aggregatedObjectRepo: this.aggregatedObjectRepo,
        objectViewService: this.objectViewService,
        listItemsRecursiveCountService: this.listItemsRecursiveCountService,
        parentObjectId: view.object_id,
        governance,
        locale: options.locale,
        contentBaseUrl,
        viewerAccount,
        viewerFavoriteIds,
      },
      this.redisFactory,
      this.logger,
    );

    const projectedCore = projectObjectCore({
      view,
      contentBaseUrl,
      refSummariesById,
      viewerAccount,
      rankVoteProjection: options.rankVoteProjection,
    });

    const projected: ProjectedObject = {
      ...projectedCore,
      isFavorited,
      hasSupervisedOwnership,
      hasExclusiveOwnership,
      hasOwnershipAuthority,
    };

    if (options.includeSeo === true) {
      return normalizeProjectedObjectForJson({
        ...projected,
        seo: this.seoService.build(projected, view.canonical ?? null),
      });
    }

    return normalizeProjectedObjectForJson(projected);
  }

  /**
   * Projects multiple views with one batched favorite/ownership lookup.
   * Order of the returned array matches the order of `views`.
   */
  async batchProject(views: ResolvedObjectView[], options: BatchProjectOptions): Promise<ProjectedObject[]> {
    if (views.length === 0) {
      return [];
    }

    const contentBaseUrl = this.config.get<string | undefined>('ipfs.contentBaseUrl');
    const viewerAccount = options.viewerAccount?.trim() || undefined;
    const governance =
      options.governance ??
      (await this.governanceResolver.resolveMergedForObjectView(
        options.governanceObjectIdFromHeader,
      ));

    const objectIds = views.map((v) => v.object_id);
    let favoriteSet = new Set<string>();
    let supervisedSet = new Set<string>();
    let exclusiveSet = new Set<string>();
    let viewerFavoriteIds: Set<string> | undefined;
    if (viewerAccount) {
      const [favoriteIds, ownershipGrouped] = await Promise.all([
        this.objectFavoriteRepo.findFavoriteObjectIdsForAccount(viewerAccount, objectIds),
        this.objectOwnershipRepo.findOwnershipObjectIdsByAccountGrouped(viewerAccount, objectIds),
      ]);
      favoriteSet = new Set(favoriteIds);
      supervisedSet = ownershipGrouped.supervised;
      exclusiveSet = ownershipGrouped.exclusive;
      viewerFavoriteIds = new Set(favoriteIds);
    }

    const allRefIds = [...new Set(views.flatMap((v) => collectObjectRefIdsFromView(v)))];
    if (viewerAccount && allRefIds.length > 0) {
      const refFavoriteIds = await this.objectFavoriteRepo.findFavoriteObjectIdsForAccount(
        viewerAccount,
        allRefIds,
      );
      viewerFavoriteIds = new Set([...(viewerFavoriteIds ?? []), ...refFavoriteIds]);
    }

    const rankVp = options.rankVoteProjection;
    const results: ProjectedObject[] = [];
    for (const view of views) {
      const refIds = collectObjectRefIdsFromView(view);
      const refSummariesById = await expandObjectRefsWithCache(
        refIds,
        {
          aggregatedObjectRepo: this.aggregatedObjectRepo,
          objectViewService: this.objectViewService,
          listItemsRecursiveCountService: this.listItemsRecursiveCountService,
          parentObjectId: view.object_id,
          governance,
          locale: options.locale,
          contentBaseUrl,
          viewerAccount,
          viewerFavoriteIds,
        },
        this.redisFactory,
        this.logger,
      );

      const projectedCore = projectObjectCore({
        view,
        contentBaseUrl,
        refSummariesById,
        viewerAccount,
        rankVoteProjection: rankVp,
      });

      let projected: ProjectedObject = {
        ...projectedCore,
        isFavorited: favoriteSet.has(view.object_id),
        hasSupervisedOwnership: supervisedSet.has(view.object_id),
        hasExclusiveOwnership: exclusiveSet.has(view.object_id),
        hasOwnershipAuthority:
          supervisedSet.has(view.object_id) || exclusiveSet.has(view.object_id),
      };

      if (options.includeSeo === true) {
        projected = {
          ...projected,
          seo: this.seoService.build(projected, view.canonical ?? null),
        };
      }

      results.push(normalizeProjectedObjectForJson(projected));
    }

    return results;
  }
}
