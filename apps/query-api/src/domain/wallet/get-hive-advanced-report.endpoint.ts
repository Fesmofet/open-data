import { BadRequestException, Injectable } from '@nestjs/common';

import { WalletExemptionsRepository } from '../../repositories';
import { DEFAULT_HIVE_SWAP_ACCOUNT } from '../../constants/wallet.constants';
import { HiveGlobalPropertiesCache } from '../feed/hive-global-properties.cache';
import { HiveAdvancedReportPagerService } from './hive-advanced-report-pager.service';
import type {
  HiveAdvancedReportBody,
  HiveAdvancedReportResponse,
} from './schemas/hive-advanced-report.schema';
import { WalletAdvancedReportPricingService } from './wallet-advanced-report-pricing.service';
import { buildAdvancedReportAccountCursor, mergeAdvancedReportGlobalHasMore } from './hive-advanced-report-pagination';

@Injectable()
export class GetHiveAdvancedReportEndpoint {
  constructor(
    private readonly pager: HiveAdvancedReportPagerService,
    private readonly pricing: WalletAdvancedReportPricingService,
    private readonly exemptions: WalletExemptionsRepository,
    private readonly hiveGlobalProperties: HiveGlobalPropertiesCache,
  ) {}

  async execute(body: HiveAdvancedReportBody): Promise<HiveAdvancedReportResponse> {
    const hasDateRange =
      body.startDate !== undefined && body.endDate !== undefined;
    if (hasDateRange) {
      const now = Math.floor(Date.now() / 1000);
      if (body.endDate! >= now) {
        throw new BadRequestException('endDate must be in the past');
      }
      if (body.startDate! > body.endDate!) {
        throw new BadRequestException('startDate must be <= endDate');
      }
    }

    const filterAccounts = body.filterAccounts.map((name) =>
      name.trim().toLowerCase(),
    );
    const perAccountLimit = body.limit + 1;
    const swapAccount =
      process.env.HIVE_SWAP_ACCOUNT?.trim().toLowerCase() ||
      DEFAULT_HIVE_SWAP_ACCOUNT;

    const accountResults = await Promise.all(
      body.accounts.map(async (account) => {
        const name = account.name.trim().toLowerCase();
        const result = await this.pager.collectForAccount({
          account: name,
          cursor: account.cursor ?? -1,
          ...(hasDateRange
            ? { startDate: body.startDate, endDate: body.endDate }
            : {}),
          targetCount: perAccountLimit,
          swapAccount,
        });
        return { name, ...result };
      }),
    );

    const allMerged = accountResults
      .flatMap((result) => result.rows)
      .sort((a, b) => b.timestamp - a.timestamp || b.operationIndex - a.operationIndex);

    const merged = allMerged.slice(0, body.limit);

    const chainContext = await this.hiveGlobalProperties.getChainContextFields();
    const viewer = body.viewer?.trim().toLowerCase();
    const exemptionRows =
      viewer && merged.length > 0
        ? await this.exemptions.findForViewerAndAccounts(
            viewer,
            [...new Set(merged.map((row) => row.userName))],
          )
        : [];
    const checkedKeys = new Set(
      exemptionRows.map(
        (row) => `${row.account}:${row.operation_index}`,
      ),
    );

    const wallet = await this.pricing.enrichRows({
      rows: merged,
      filterAccounts,
      currency: body.currency,
      checkedKeys,
      chainContext,
    });

    const totals = this.pricing.calcTotals(wallet);
    const accounts = accountResults
      .map((result) =>
        buildAdvancedReportAccountCursor({
          accountName: result.name,
          fetched: result.pagingRows,
          merged,
          hasMoreFromPager: result.hasMore,
          pageLimit: body.limit,
        }),
      )
      .filter((account): account is NonNullable<typeof account> => account != null);
    const hasMore = mergeAdvancedReportGlobalHasMore({
      allMergedCount: allMerged.length,
      pageLimit: body.limit,
      accountCursors: accounts,
    });

    return {
      wallet,
      accounts,
      hasMore,
      deposits: totals.deposits,
      withdrawals: totals.withdrawals,
    };
  }
}
