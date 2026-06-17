import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { ObjectProjectionModule } from '../object-projection/object-projection.module';
import { GetUserFavoritesEndpoint } from './get-user-favorites.endpoint';
import { GetUserFavoritesTypesEndpoint } from './get-user-favorites-types.endpoint';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, ObjectProjectionModule],
  providers: [GetUserFavoritesTypesEndpoint, GetUserFavoritesEndpoint],
  exports: [GetUserFavoritesTypesEndpoint, GetUserFavoritesEndpoint],
})
export class FavoritesModule {}
