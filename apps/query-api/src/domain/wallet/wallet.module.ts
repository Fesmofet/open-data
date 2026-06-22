import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../../repositories';
import { FeedModule } from '../feed';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';
import { GetUserHiveHpDelegationsEndpoint } from './get-user-hive-hp-delegations.endpoint';
import { GetUserHiveRcDelegationsEndpoint } from './get-user-hive-rc-delegations.endpoint';
import { GetUserHiveWalletEndpoint } from './get-user-hive-wallet.endpoint';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';

@Module({
  imports: [RepositoriesModule, FeedModule],
  providers: [
    GetUserWaivWalletEndpoint,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
  ],
  exports: [
    GetUserWaivWalletEndpoint,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
  ],
})
export class WalletModule {}
