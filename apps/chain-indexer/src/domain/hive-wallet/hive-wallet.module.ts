import { Module } from '@nestjs/common';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { HiveWalletOperationHandlers } from './hive-wallet-operation-handlers';

@Module({
  imports: [NotificationAdapterModule],
  providers: [HiveWalletOperationHandlers],
  exports: [HiveWalletOperationHandlers],
})
export class HiveWalletModule {}
