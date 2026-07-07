import { Module } from '@nestjs/common';

import { RepositoriesModule } from '../../repositories';
import { FeedModule } from '../feed';
import { GetUserEngineTokenDelegationsEndpoint } from './get-user-engine-token-delegations.endpoint';
import { GetUserHiveHpDelegationsEndpoint } from './get-user-hive-hp-delegations.endpoint';
import { GetUserHiveRcDelegationsEndpoint } from './get-user-hive-rc-delegations.endpoint';
import { GetUserHiveWalletEndpoint } from './get-user-hive-wallet.endpoint';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';
import { GetUserWaivWalletHistoryEndpoint } from './get-user-waiv-wallet-history.endpoint';
import { GetUserEngineWalletEndpoint } from './get-user-engine-wallet.endpoint';
import { GetUserEngineWalletHistoryEndpoint } from './get-user-engine-wallet-history.endpoint';
import { GetUserEngineSwapListEndpoint } from './get-user-engine-swap-list.endpoint';
import { PostUserEngineSwapQuoteEndpoint } from './post-user-engine-swap-quote.endpoint';
import { GetUserEngineDepositAddressEndpoint } from './get-user-engine-deposit-address.endpoint';
import { GetUserEngineDepositListEndpoint } from './get-user-engine-deposit-list.endpoint';
import { GetUserEngineWithdrawListEndpoint } from './get-user-engine-withdraw-list.endpoint';
import { PostUserEngineWithdrawQuoteEndpoint } from './post-user-engine-withdraw-quote.endpoint';
import { EngineWithdrawQuoteService } from './engine-swap/engine-withdraw-quote.service';
import { GetHiveAdvancedReportEndpoint } from './get-hive-advanced-report.endpoint';
import { GetWaivAdvancedReportEndpoint } from './get-waiv-advanced-report.endpoint';
import { WaivGeneratedReportsService } from './waiv-generated-reports.service';
import { WaivGeneratedReportWorkerService } from './waiv-generated-report-worker.service';
import { GetHiveAccountCreatedDatesEndpoint } from './get-hive-account-created-dates.endpoint';
import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';
import { HiveAccountCreationDateService } from './hive-account-creation-date.service';
import { UpsertHiveWalletExemptionEndpoint } from './upsert-hive-wallet-exemption.endpoint';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';
import { WaivWalletHistoryPagerService } from './waiv-wallet-history-pager.service';
import { EngineWalletHistoryPagerService } from './engine-wallet-history-pager.service';

@Module({
  imports: [RepositoriesModule, FeedModule],
  providers: [
    GetUserWaivWalletEndpoint,
    GetUserWaivWalletHistoryEndpoint,
    GetUserEngineWalletEndpoint,
    GetUserEngineWalletHistoryEndpoint,
    GetUserEngineSwapListEndpoint,
    PostUserEngineSwapQuoteEndpoint,
    GetUserEngineDepositListEndpoint,
    GetUserEngineDepositAddressEndpoint,
    GetUserEngineWithdrawListEndpoint,
    PostUserEngineWithdrawQuoteEndpoint,
    EngineWithdrawQuoteService,
    WaivWalletHistoryPagerService,
    EngineWalletHistoryPagerService,
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
    WaivGeneratedReportsService,
    WaivGeneratedReportWorkerService,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
  exports: [
    GetUserWaivWalletEndpoint,
    GetUserWaivWalletHistoryEndpoint,
    GetUserEngineWalletEndpoint,
    GetUserEngineWalletHistoryEndpoint,
    GetUserEngineSwapListEndpoint,
    PostUserEngineSwapQuoteEndpoint,
    GetUserEngineDepositListEndpoint,
    GetUserEngineDepositAddressEndpoint,
    GetUserEngineWithdrawListEndpoint,
    PostUserEngineWithdrawQuoteEndpoint,
    EngineWithdrawQuoteService,
    GetUserEngineTokenDelegationsEndpoint,
    GetUserHiveWalletEndpoint,
    GetUserHiveHpDelegationsEndpoint,
    GetUserHiveRcDelegationsEndpoint,
    GetHiveAdvancedReportEndpoint,
    GetWaivAdvancedReportEndpoint,
    WaivGeneratedReportsService,
    GetHiveAccountCreatedDatesEndpoint,
    UpsertHiveWalletExemptionEndpoint,
  ],
})
export class WalletModule {}
