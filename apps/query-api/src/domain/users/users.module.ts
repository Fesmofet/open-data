import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { GetUserProfileEndpoint } from './get-user-profile.endpoint';
import { GetUserAccountSidebarEndpoint } from './get-user-account-sidebar.endpoint';
import { HiveAccountsCache } from './hive-accounts.cache';
import { HiveRewardFundCache } from './hive-reward-fund.cache';
import { WaivRewardPoolCache } from './waiv-reward-pool.cache';

@Module({
  imports: [RepositoriesModule],
  providers: [
    GetUserProfileEndpoint,
    GetUserAccountSidebarEndpoint,
    HiveAccountsCache,
    HiveRewardFundCache,
    WaivRewardPoolCache,
  ],
  exports: [
    GetUserProfileEndpoint,
    GetUserAccountSidebarEndpoint,
  ],
})
export class UsersModule {}
