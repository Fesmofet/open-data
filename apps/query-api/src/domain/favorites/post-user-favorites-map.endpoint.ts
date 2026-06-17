import { Injectable } from '@nestjs/common';
import type { AggregatedObject } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  UserFavoritesRepository,
  UserMetadataRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import { ObjectProjectionService } from '../object-projection';
import type { ProjectedObject } from '../object-projection/projected-object.types';
import { FAVORITES_MAP_UPDATE_TYPES } from './favorites.constants';
import type { UserFavoritesMapBody, UserFavoritesMapResponse } from './post-user-favorites-map.schema';

function orderAggregatedByIds(objects: AggregatedObject[], objectIds: string[]): AggregatedObject[] {
  const map = new Map(objects.map((o) => [o.core.object_id, o]));
  return objectIds.map((id) => map.get(id)).filter((o): o is AggregatedObject => o != null);
}

@Injectable()
export class PostUserFavoritesMapEndpoint {
  constructor(
    private readonly userMetadataRepo: UserMetadataRepository,
    private readonly shopDeselectRepo: UserShopDeselectRepository,
    private readonly favoritesRepo: UserFavoritesRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly objectProjection: ObjectProjectionService,
  ) {}

  async execute(
    username: string,
    body: UserFavoritesMapBody,
    locale: string,
    governanceObjectIdFromHeader: string | undefined,
    viewerAccount: string | undefined,
  ): Promise<UserFavoritesMapResponse | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const [flags, deselectIds] = await Promise.all([
      this.userMetadataRepo.findShopVisibilityFlags(name),
      this.shopDeselectRepo.findObjectIdsByAccount(name),
    ]);

    const scope = {
      account: name,
      hideFavoriteObjects: flags.hide_favorite_objects,
      shopDeselectObjectIds: deselectIds,
    };

    const fetchLimit = body.limit + 1;
    const objectIds = await this.favoritesRepo.findMapObjectIdsByScope(
      scope,
      body.box,
      body.objectTypes,
      body.skip,
      fetchLimit,
    );

    const hasMore = objectIds.length > body.limit;
    const pageIds = hasMore ? objectIds.slice(0, body.limit) : objectIds;

    if (pageIds.length === 0) {
      return { items: [], hasMore: false };
    }

    const { objects, voterWaivPowers, rankVoteProjection } =
      await this.aggregatedObjectRepo.loadByObjectIds(pageIds, {
        viewerAccount,
      });
    const ordered = orderAggregatedByIds(objects, pageIds);

    const views = this.objectViewService.resolve(ordered, voterWaivPowers, {
      update_types: [...FAVORITES_MAP_UPDATE_TYPES],
      locale,
      include_rejected: false,
    });

    const items: ProjectedObject[] = await this.objectProjection.batchProject(views, {
      locale,
      includeSeo: false,
      governanceObjectIdFromHeader,
      viewerAccount,
      rankVoteProjection,
    });

    return { items, hasMore };
  }
}
