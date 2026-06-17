import { Injectable } from '@nestjs/common';
import {
  UserFavoritesRepository,
  UserMetadataRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import type { UserFavoritesTypesResponse } from './favorites.schema';

@Injectable()
export class GetUserFavoritesTypesEndpoint {
  constructor(
    private readonly userMetadataRepo: UserMetadataRepository,
    private readonly shopDeselectRepo: UserShopDeselectRepository,
    private readonly favoritesRepo: UserFavoritesRepository,
  ) {}

  async execute(username: string): Promise<UserFavoritesTypesResponse> {
    const name = username.trim();
    if (name.length === 0) {
      return { types: [] };
    }

    const [flags, deselectIds] = await Promise.all([
      this.userMetadataRepo.findShopVisibilityFlags(name),
      this.shopDeselectRepo.findObjectIdsByAccount(name),
    ]);

    const types = await this.favoritesRepo.findTypesByScope({
      account: name,
      hideFavoriteObjects: flags.hide_favorite_objects,
      shopDeselectObjectIds: deselectIds,
    });

    return { types };
  }
}
