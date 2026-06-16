import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance';
import { RepositoriesModule } from '../../repositories';
import { GetObjectUpdatesFeedEndpoint } from './get-object-updates-feed.endpoint';
import { GetUpdateVotersEndpoint } from './get-update-voters.endpoint';

@Module({
  imports: [RepositoriesModule, GovernanceModule],
  providers: [GetObjectUpdatesFeedEndpoint, GetUpdateVotersEndpoint],
  exports: [GetObjectUpdatesFeedEndpoint, GetUpdateVotersEndpoint],
})
export class ObjectUpdatesModule {}
