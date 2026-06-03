import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { RepositoriesModule } from '../../repositories';
import { GovernanceModule } from '../governance';
import { ObjectProjectionModule } from '../object-projection/object-projection.module';
import { GetSearchCountsEndpoint } from './get-search-counts.endpoint';
import { GetSearchEndpoint } from './get-search.endpoint';
import { GetSearchObjectsByIdsEndpoint } from './get-search-objects-by-ids.endpoint';
import { SearchObjectsDisplayService } from './search-objects-display.service';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, GovernanceModule, ObjectProjectionModule],
  providers: [
    SearchObjectsDisplayService,
    GetSearchEndpoint,
    GetSearchCountsEndpoint,
    GetSearchObjectsByIdsEndpoint,
  ],
  exports: [
    SearchObjectsDisplayService,
    GetSearchEndpoint,
    GetSearchCountsEndpoint,
    GetSearchObjectsByIdsEndpoint,
  ],
})
export class SearchModule {}
