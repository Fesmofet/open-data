import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { RepositoriesModule } from '../../repositories';
import { OslCustomJsonParser } from './osl-custom-json-parser';
import { HiveEngineDepositHandler } from './handlers/hive-engine-deposit.handler';
import { UserNotificationSettingsHandler } from './handlers/user-notification-settings.handler';
import { UserMetadataHandler } from './handlers/user-metadata.handler';

@Module({
  imports: [RepositoriesModule, GovernanceModule],
  providers: [
    OslCustomJsonParser,
    HiveEngineDepositHandler,
    UserNotificationSettingsHandler,
    UserMetadataHandler,
  ],
  exports: [OslCustomJsonParser, UserMetadataHandler],
})
export class OslParserModule {}
