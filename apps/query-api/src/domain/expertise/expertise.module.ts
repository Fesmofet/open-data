import { Module } from '@nestjs/common';
import { ObjectsDomainModule } from '@opden-data-layer/objects-domain';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { ObjectProjectionModule } from '../object-projection/object-projection.module';
import { GetUserExpertiseCountersEndpoint } from './get-user-expertise-counters.endpoint';
import { GetUserExpertiseObjectsEndpoint } from './get-user-expertise-objects.endpoint';

@Module({
  imports: [RepositoriesModule, ObjectsDomainModule, ObjectProjectionModule],
  providers: [GetUserExpertiseCountersEndpoint, GetUserExpertiseObjectsEndpoint],
  exports: [GetUserExpertiseCountersEndpoint, GetUserExpertiseObjectsEndpoint],
})
export class ExpertiseModule {}
