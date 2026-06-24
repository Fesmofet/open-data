import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../../repositories';
import { FeedModule } from '../feed';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';
import { GetUserHiveHpDelegationsEndpoint } from './get-user-hive-hp-delegations.endpoint';
import { GetUserHiveRcDelegationsEndpoint } from './get-user-hive-rc-delegations.endpoint';
import { GetUserHiveWalletEndpoint } from './get-user-hive-wallet.endpoint';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';
import { GetHiveAdvancedReportEndpoint } from './get-hive-advanced-report.endpoint';
import { GetHiveAccountCreatedDatesEndpoint } from './get-hive-account-created-dates.endpoint';
import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';
import { UpsertHiveWalletExemptionEndpoint } from './upsert-hive-wallet-exemption.endpoint';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';

@Module({
  imports: [RepositoriesModule, FeedModule],
  providers: [
    GetUserWaivWalletEndpoint,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
    HiveAdvancedReportPagerService,
    WalletAdvancedReportPricingService,
    HiveAccountCreationDateService,
    GetHiveAdvancedReportEndpoint,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
  exports: [
    GetUserWaivWalletEndpoint,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
    GetHiveAdvancedReportEndpoint,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
})
export class WalletModule {}
