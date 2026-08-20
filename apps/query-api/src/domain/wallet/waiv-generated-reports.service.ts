import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  JsonValue,
  WaivGeneratedReport,
  WaivGeneratedReportStoredRow,
} from '@opden-data-layer/odl-db-types';

import {
  flushMergeRewardFold,
  mergeWaivRewardRowsInStream,
  parseWaivMergeRewardFoldState,
  type WaivMergeRewardFoldState,
} from '@opden-data-layer/core/waiv-advanced-report';

import { normalizeHiveAccount } from '../../auth';
import {
  WAIV_GENERATED_REPORT_LIST_DEFAULT_LIMIT,
  WAIV_GENERATED_REPORT_MAX_CONCURRENT,
  WAIV_GENERATED_REPORT_PAGE_SIZE,
  WAIV_GENERATED_REPORT_ROWS_DEFAULT_LIMIT,
  WAIV_GENERATED_REPORT_STATUS,
} from '../../constants/waiv-generated-report.constants';
import { WaivGeneratedReportsRepository } from '../../repositories/waiv-generated-reports.repository';
import type { WaivAdvancedReportRowDto } from './schemas/waiv-advanced-report.schema';
import type {
  WaivGeneratedReportCreateBody,
  WaivGeneratedReportListResponse,
  WaivGeneratedReportRowsResponse,
  WaivGeneratedReportSummaryDto,
} from './schemas/waiv-generated-report.schema';
import { WaivAdvancedReportPagerService } from './waiv-advanced-report-pager.service';
import { WaivAdvancedReportPricingService } from './waiv-advanced-report-pricing.service';

@Injectable()
export class WaivGeneratedReportsService {
  constructor(
    private readonly reports: WaivGeneratedReportsRepository,
    private readonly pager: WaivAdvancedReportPagerService,
    private readonly pricing: WaivAdvancedReportPricingService,
  ) {}

  async createReport(
    owner: string,
    body: WaivGeneratedReportCreateBody,
  ): Promise<WaivGeneratedReportSummaryDto> {
    const normalizedOwner = normalizeHiveAccount(owner);
    const activeCount = await this.reports.countActiveByOwner(normalizedOwner);
    if (activeCount >= WAIV_GENERATED_REPORT_MAX_CONCURRENT) {
      throw new BadRequestException(
        `Maximum ${WAIV_GENERATED_REPORT_MAX_CONCURRENT} concurrent generated reports`,
      );
    }

    const filterAccounts = [
      ...new Set(body.filterAccounts.map((name) => normalizeHiveAccount(name))),
    ];
    const accountsProgress = filterAccounts.map((name) => ({
      name,
      cursor: null,
      hasMore: true,
    }));

    const inserted = await this.reports.insertReport({
      owner: normalizedOwner,
      profile_account: normalizeHiveAccount(body.profileAccount),
      currency: body.currency,
      start_date_ts: body.startDate,
      end_date_ts: body.endDate,
      filter_accounts: filterAccounts,
      include_swaps_and_trades: body.includeSwapsAndTrades,
      merge_rewards: body.mergeRewards,
      accounts_progress: accountsProgress,
    });
    if (!inserted) {
      throw new BadRequestException('Failed to create generated report');
    }
    return toSummaryDto(inserted);
  }

  async listReports(
    owner: string,
    skip = 0,
    limit = WAIV_GENERATED_REPORT_LIST_DEFAULT_LIMIT,
  ): Promise<WaivGeneratedReportListResponse> {
    const rows = await this.reports.listByOwner({
      owner: normalizeHiveAccount(owner),
      skip,
      limit,
    });
    return { reports: rows.map(toSummaryDto) };
  }

  async getReport(owner: string, reportId: string): Promise<WaivGeneratedReportSummaryDto> {
    const report = await this.requireOwnedReport(owner, reportId);
    return toSummaryDto(report);
  }

  async listReportRows(
    owner: string,
    reportId: string,
    skip = 0,
    limit = WAIV_GENERATED_REPORT_ROWS_DEFAULT_LIMIT,
  ): Promise<WaivGeneratedReportRowsResponse> {
    await this.requireOwnedReport(owner, reportId);
    const stored = await this.reports.listStoredRows({ reportId, skip, limit: limit + 1 });
    const hasMore = stored.length > limit;
    const page = hasMore ? stored.slice(0, limit) : stored;
    return {
      wallet: page.map(storedRowToDto),
      hasMore,
    };
  }

  async toggleRowChecked(
    owner: string,
    reportId: string,
    operationIndex: number,
    checked: boolean,
  ): Promise<WaivGeneratedReportSummaryDto> {
    await this.requireOwnedReport(owner, reportId);
    const ok = await this.reports.toggleRowChecked({
      reportId,
      operationIndex,
      checked,
    });
    if (!ok) {
      throw new NotFoundException('Report row not found');
    }
    const updated = await this.reports.findById(reportId);
    if (!updated) {
      throw new NotFoundException('Report not found');
    }
    return toSummaryDto(updated);
  }

  async stopReport(owner: string, reportId: string): Promise<WaivGeneratedReportSummaryDto> {
    const report = await this.requireOwnedReport(owner, reportId);
    if (
      report.status !== WAIV_GENERATED_REPORT_STATUS.pending &&
      report.status !== WAIV_GENERATED_REPORT_STATUS.inProgress
    ) {
      throw new BadRequestException('Report is not running');
    }
    await this.flushPendingMergeRewardFold(reportId, report);
    const totals = await this.reports.recalcTotals(reportId);
    const rowCount = await this.reports.countRows(reportId);
    await this.reports.updateReport(reportId, {
      status: WAIV_GENERATED_REPORT_STATUS.stopped,
      merge_reward_fold: null,
      deposits: totals.deposits,
      withdrawals: totals.withdrawals,
      row_count: rowCount,
      completed_at: new Date(),
    });
    const updated = await this.reports.findById(reportId);
    if (!updated) {
      throw new NotFoundException('Report not found');
    }
    return toSummaryDto(updated);
  }

  async deleteReport(owner: string, reportId: string): Promise<void> {
    await this.requireOwnedReport(owner, reportId);
    const deleted = await this.reports.deleteByIdAndOwner(
      reportId,
      normalizeHiveAccount(owner),
    );
    if (!deleted) {
      throw new NotFoundException('Report not found');
    }
  }

  async processNextBatch(reportId: string): Promise<void> {
    const report = await this.reports.findById(reportId);
    if (!report) {
      return;
    }
    if (
      report.status === WAIV_GENERATED_REPORT_STATUS.stopped ||
      report.status === WAIV_GENERATED_REPORT_STATUS.completed ||
      report.status === WAIV_GENERATED_REPORT_STATUS.failed
    ) {
      return;
    }

    if (report.status === WAIV_GENERATED_REPORT_STATUS.pending) {
      await this.reports.updateReport(reportId, {
        status: WAIV_GENERATED_REPORT_STATUS.inProgress,
      });
    }

    const progress = [...report.accounts_progress];
    const accountEntry = progress.find((entry) => entry.hasMore);
    if (!accountEntry) {
      await this.flushPendingMergeRewardFold(reportId, report);
      const totals = await this.reports.recalcTotals(reportId);
      await this.reports.updateReport(reportId, {
        status: WAIV_GENERATED_REPORT_STATUS.completed,
        merge_reward_fold: null,
        deposits: totals.deposits,
        withdrawals: totals.withdrawals,
        completed_at: new Date(),
      });
      return;
    }

    try {
      const result = await this.pager.collectForAccount({
        account: accountEntry.name,
        cursor: accountEntry.cursor,
        startDate: report.start_date_ts,
        endDate: report.end_date_ts,
        targetCount: WAIV_GENERATED_REPORT_PAGE_SIZE + 1,
        includeSwapsAndTrades: report.include_swaps_and_trades,
        filterAccounts: report.filter_accounts,
      });

      // Price rows BEFORE merge so each reward keeps its own daily WAIV/USD rate.
      // Merging summed quantities and re-pricing at a single (anchor) rate would
      // drift the fiat totals versus the unmerged report.
      const enriched = await this.pricing.enrichRows({
        rows: result.rows,
        currency: report.currency as import('@opden-data-layer/core').SupportedCurrency,
        checkedKeys: new Set(),
      });

      const initialFold = parseWaivMergeRewardFoldState(
        report.merge_reward_fold,
      ) as WaivMergeRewardFoldState<WaivAdvancedReportRowDto> | null;
      const streamResult = mergeWaivRewardRowsInStream(
        enriched,
        report.merge_rewards,
        initialFold,
      );

      let rowsToInsert = streamResult.rows as WaivAdvancedReportRowDto[];
      let nextFold = streamResult.fold as WaivMergeRewardFoldState<WaivAdvancedReportRowDto> | null;

      accountEntry.cursor = result.lastCursor;
      accountEntry.hasMore = result.hasMore;

      if (!accountEntry.hasMore) {
        rowsToInsert = [
          ...rowsToInsert,
          ...(flushMergeRewardFold(nextFold) as WaivAdvancedReportRowDto[]),
        ];
        nextFold = null;
      }

      const allDone = progress.every((entry) => !entry.hasMore);
      if (allDone && nextFold) {
        rowsToInsert = [
          ...rowsToInsert,
          ...(flushMergeRewardFold(nextFold) as WaivAdvancedReportRowDto[]),
        ];
        nextFold = null;
      }

      await this.persistDtoRows(reportId, rowsToInsert);

      const totals = await this.reports.recalcTotals(reportId);
      const rowCount = await this.reports.countRows(reportId);

      await this.reports.updateReport(reportId, {
        accounts_progress: progress,
        merge_reward_fold: nextFold,
        row_count: rowCount,
        deposits: totals.deposits,
        withdrawals: totals.withdrawals,
        ...(allDone
          ? {
              status: WAIV_GENERATED_REPORT_STATUS.completed,
              completed_at: new Date(),
            }
          : {}),
      });
    } catch (e) {
      await this.reports.updateReport(reportId, {
        status: WAIV_GENERATED_REPORT_STATUS.failed,
        error_message: (e as Error).message,
        completed_at: new Date(),
      });
    }
  }

  private async requireOwnedReport(
    owner: string,
    reportId: string,
  ): Promise<WaivGeneratedReport> {
    const report = await this.reports.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (normalizeHiveAccount(report.owner) !== normalizeHiveAccount(owner)) {
      throw new ForbiddenException('Report owner mismatch');
    }
    return report;
  }

  private async flushPendingMergeRewardFold(
    reportId: string,
    report: WaivGeneratedReport,
  ): Promise<void> {
    if (!report.merge_rewards) {
      return;
    }
    const flushed = flushMergeRewardFold(
      parseWaivMergeRewardFoldState(report.merge_reward_fold) as
        | WaivMergeRewardFoldState<WaivAdvancedReportRowDto>
        | null,
    ) as WaivAdvancedReportRowDto[];
    await this.persistDtoRows(reportId, flushed);
  }

  private async persistDtoRows(
    reportId: string,
    rows: readonly WaivAdvancedReportRowDto[],
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.reports.insertRows(
      rows.map((row) => ({
        report_id: reportId,
        operation_index: row.operationIndex,
        timestamp: row.timestamp,
        user_name: row.userName,
        checked: row.checked ?? false,
        row: row as unknown as JsonValue,
      })),
    );
  }
}

function toSummaryDto(report: WaivGeneratedReport): WaivGeneratedReportSummaryDto {
  return {
    id: report.id,
    owner: report.owner,
    profileAccount: report.profile_account,
    status: report.status,
    currency: report.currency,
    startDateTs: report.start_date_ts,
    endDateTs: report.end_date_ts,
    filterAccounts: report.filter_accounts,
    includeSwapsAndTrades: report.include_swaps_and_trades,
    mergeRewards: report.merge_rewards,
    deposits: Number(report.deposits),
    withdrawals: Number(report.withdrawals),
    rowCount: report.row_count,
    errorMessage: report.error_message,
    createdAt: report.created_at.toISOString(),
    updatedAt: report.updated_at.toISOString(),
    completedAt: report.completed_at?.toISOString() ?? null,
  };
}

function storedRowToDto(
  stored: WaivGeneratedReportStoredRow,
): WaivAdvancedReportRowDto {
  const snapshot = stored.row as WaivAdvancedReportRowDto;
  return {
    ...snapshot,
    checked: stored.checked,
  };
}
