import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';
import { RepositoriesModule } from '../../repositories';
import { OslCustomJsonParser } from './osl-custom-json-parser';
import { HiveEngineDepositHandler } from './handlers/hive-engine-deposit.handler';

@Module({
  imports: [RepositoriesModule, GovernanceModule],
  providers: [OslCustomJsonParser, HiveEngineDepositHandler],
  exports: [OslCustomJsonParser],
})
export class OslParserModule {}
