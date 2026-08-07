import { Module } from '@nestjs/common';
import { NotificationAdapterModule } from '../notification-adapter/notification-adapter.module';
import { HiveChainContextCache } from './hive-chain-context.cache';
import { HiveWalletOperationHandlers } from './hive-wallet-operation-handlers';

@Module({
  imports: [NotificationAdapterModule],
  providers: [HiveChainContextCache, HiveWalletOperationHandlers],
  exports: [HiveWalletOperationHandlers],
})
export class HiveWalletModule {}
