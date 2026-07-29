import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { HiveHpDelegationService } from './hive-hp-delegation.service';
import { HiveRcDelegationService } from './hive-rc-delegation.service';

@Module({
  imports: [RepositoriesModule, NotificationAdapterModule],
  providers: [HiveHpDelegationService, HiveRcDelegationService],
  exports: [HiveHpDelegationService, HiveRcDelegationService],
})
export class HiveDelegationModule {}
