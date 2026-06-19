import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../../repositories';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';

@Module({
  imports: [RepositoriesModule],
  providers: [GetUserWaivWalletEndpoint, GetUserEngineTokenDelegationsEndpoint],
  exports: [GetUserWaivWalletEndpoint, GetUserEngineTokenDelegationsEndpoint],
})
export class WalletModule {}
