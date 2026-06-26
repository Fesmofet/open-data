import { BadRequestException, Injectable } from '@nestjs/common';

import { WalletExemptionsRepository } from '../../repositories';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';
import type {
  WaivAdvancedReportBody,
  WaivAdvancedReportResponse,
} from './schemas/waiv-advanced-report.schema';
import {
  buildWaivAdvancedReportAccountCursor,
  mergeWaivAdvancedReportGlobalHasMore,
} from './waiv-advanced-report-pagination';
import {
  compareWaivHistoryCursorsDesc,
  decodeWaivWalletHistoryCursor,
  rowCursorFromParts,
} from './waiv-wallet-history-cursor';
import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';

@Injectable()
export class GetWaivAdvancedReportEndpoint {
  constructor(
    private readonly pager: WaivAdvancedReportPagerService,
    private readonly pricing: WaivAdvancedReportPricingService,
    private readonly exemptions: WalletExemptionsRepository,
  ) {}

  async execute(body: WaivAdvancedReportBody): Promise<WaivAdvancedReportResponse> {
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

    const accountResults = await Promise.all(
      body.accounts.map(async (account) => {
        const name = account.name.trim().toLowerCase();
        const result = await this.pager.collectForAccount({
          account: name,
          cursor: account.cursor ?? null,
          ...(hasDateRange
            ? { startDate: body.startDate, endDate: body.endDate }
            : {}),
          targetCount: perAccountLimit,
          includeSwapsAndTrades: body.includeSwapsAndTrades,
          filterAccounts,
        });
        return { name, ...result };
      }),
    );

    const allMerged = accountResults
      .flatMap((result) => result.rows)
      .sort((a, b) =>
        compareWaivHistoryCursorsDesc(
          cursorFromWaivAdvancedReportRow(a),
          cursorFromWaivAdvancedReportRow(b),
        ),
      );

    const merged = allMerged.slice(0, body.limit);

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
      currency: body.currency,
      checkedKeys,
    });

    const totals = this.pricing.calcTotals(wallet);
    const accounts = accountResults
      .map((result) =>
        buildWaivAdvancedReportAccountCursor({
          accountName: result.name,
          fetched: result.pagingRows,
          merged,
          hasMoreFromPager: result.hasMore,
          pageLimit: body.limit,
          lastCursor: result.lastCursor,
        }),
      )
      .filter((account): account is NonNullable<typeof account> => account != null);
    const hasMore = mergeWaivAdvancedReportGlobalHasMore({
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

function cursorFromWaivAdvancedReportRow(
  row: WaivAdvancedReportRawRow,
) {
  return (
    decodeWaivWalletHistoryCursor(row.cursor) ??
    rowCursorFromParts(row.timestamp, String(row.operationIndex), 'rpc')
  );
}
