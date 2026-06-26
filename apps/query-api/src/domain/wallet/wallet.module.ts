import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../../repositories';
import { FeedModule } from '../feed';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';
import { GetUserHiveHpDelegationsEndpoint } from './get-user-hive-hp-delegations.endpoint';
import { GetUserHiveRcDelegationsEndpoint } from './get-user-hive-rc-delegations.endpoint';
import { GetUserHiveWalletEndpoint } from './get-user-hive-wallet.endpoint';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';
import { GetUserWaivWalletHistoryEndpoint } from './get-user-waiv-wallet-history.endpoint';
import { GetHiveAdvancedReportEndpoint } from './get-hive-advanced-report.endpoint';
import { GetWaivAdvancedReportEndpoint } from './get-waiv-advanced-report.endpoint';
import { GetHiveAccountCreatedDatesEndpoint } from './get-hive-account-created-dates.endpoint';
import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';
import { UpsertHiveWalletExemptionEndpoint } from './upsert-hive-wallet-exemption.endpoint';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';
import { WaivWalletHistoryPagerService } from './waiv-wallet-history-pager.service';

@Module({
  imports: [RepositoriesModule, FeedModule],
  providers: [
    GetUserWaivWalletEndpoint,
    GetUserWaivWalletHistoryEndpoint,
    WaivWalletHistoryPagerService,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
    HiveAdvancedReportPagerService,
    WaivAdvancedReportPagerService,
    WaivAdvancedReportPricingService,
    WalletAdvancedReportPricingService,
    HiveAccountCreationDateService,
    GetHiveAdvancedReportEndpoint,
    GetWaivAdvancedReportEndpoint,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
  exports: [
    GetUserWaivWalletEndpoint,
    GetUserWaivWalletHistoryEndpoint,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
    GetHiveAdvancedReportEndpoint,
    GetWaivAdvancedReportEndpoint,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
})
export class WalletModule {}
