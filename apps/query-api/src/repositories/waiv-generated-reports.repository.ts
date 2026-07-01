import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import type {
  WaivGeneratedReport,
  WaivGeneratedReportAccountProgress,
  WaivGeneratedReportStatus,
  WaivGeneratedReportStoredRow,
  NewWaivGeneratedReport,
  NewWaivGeneratedReportStoredRow,
  WaivGeneratedReportUpdate,
  JsonValue,
} from '@opden-data-layer/core';
import { calcDepositWithdrawals } from '@opden-data-layer/core/waiv-advanced-report';
import type { WaivAdvancedReportRowDto } from '../domain/wallet/schemas/waiv-advanced-report.schema';
import type { Database } from '../database';
import { KYSELY } from '../database';
import {
  WAIV_GENERATED_REPORT_MAX_CONCURRENT,
  WAIV_GENERATED_REPORT_STATUS,
} from '../constants/waiv-generated-report.constants';

type DbExecutor = Kysely<Database>;

function jsonValueForJsonb(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function jsonb(value: unknown) {
  return sql`${JSON.stringify(jsonValueForJsonb(value))}::jsonb`;
}

@Injectable()
export class WaivGeneratedReportsRepository {
  private readonly logger = new Logger(WaivGeneratedReportsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async countActiveByOwner(owner: string): Promise<number> {
    try {
      const result = await this.db
        .selectFrom('waiv_generated_reports')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('owner', '=', owner.trim().toLowerCase())
        .where('status', 'in', [
          WAIV_GENERATED_REPORT_STATUS.pending,
          WAIV_GENERATED_REPORT_STATUS.inProgress,
        ])
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return WAIV_GENERATED_REPORT_MAX_CONCURRENT;
    }
  }

  async insertReport(
    data: {
      owner: string;
      profile_account: string;
      currency: string;
      start_date_ts: number;
      end_date_ts: number;
      filter_accounts: string[];
      include_swaps_and_trades: boolean;
      merge_rewards: boolean;
      accounts_progress: WaivGeneratedReportAccountProgress[];
    },
  ): Promise<WaivGeneratedReport | null> {
    try {
      return await this.db
        .insertInto('waiv_generated_reports')
        .values({
          owner: data.owner,
          profile_account: data.profile_account,
          currency: data.currency,
          start_date_ts: data.start_date_ts,
          end_date_ts: data.end_date_ts,
          filter_accounts: data.filter_accounts,
          include_swaps_and_trades: data.include_swaps_and_trades,
          merge_rewards: data.merge_rewards,
          accounts_progress: jsonb(data.accounts_progress),
          status: WAIV_GENERATED_REPORT_STATUS.pending,
          deposits: 0,
          withdrawals: 0,
          row_count: 0,
        } as NewWaivGeneratedReport)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async findById(id: string): Promise<WaivGeneratedReport | null> {
    try {
      const row = await this.db
        .selectFrom('waiv_generated_reports')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      return row ?? null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async listByOwner(params: {
    owner: string;
    skip: number;
    limit: number;
  }): Promise<WaivGeneratedReport[]> {
    try {
      return await this.db
        .selectFrom('waiv_generated_reports')
        .selectAll()
        .where('owner', '=', params.owner.trim().toLowerCase())
        .orderBy('created_at', 'desc')
        .offset(params.skip)
        .limit(params.limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async findNextRunnableReport(): Promise<WaivGeneratedReport | null> {
    try {
      const pending = await this.db
        .selectFrom('waiv_generated_reports')
        .selectAll()
        .where('status', '=', WAIV_GENERATED_REPORT_STATUS.pending)
        .orderBy('created_at', 'asc')
        .limit(1)
        .executeTakeFirst();
      if (pending) {
        return pending;
      }
      return (
        (await this.db
          .selectFrom('waiv_generated_reports')
          .selectAll()
          .where('status', '=', WAIV_GENERATED_REPORT_STATUS.inProgress)
          .orderBy('updated_at', 'asc')
          .limit(1)
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async updateReport(
    id: string,
    patch: {
      status?: WaivGeneratedReportStatus;
      accounts_progress?: WaivGeneratedReportAccountProgress[];
      merge_reward_fold?: import('@opden-data-layer/core/waiv-advanced-report').WaivMergeRewardFoldState | null;
      deposits?: number | string;
      withdrawals?: number | string;
      row_count?: number;
      error_message?: string | null;
      completed_at?: Date | null;
    },
    trx?: DbExecutor,
  ): Promise<boolean> {
    try {
      const setValues: Record<string, unknown> = {
        updated_at: new Date(),
      };
      if (patch.status !== undefined) {
        setValues.status = patch.status;
      }
      if (patch.accounts_progress !== undefined) {
        setValues.accounts_progress = jsonb(patch.accounts_progress);
      }
      if (patch.merge_reward_fold !== undefined) {
        setValues.merge_reward_fold =
          patch.merge_reward_fold === null ? null : jsonb(patch.merge_reward_fold);
      }
      if (patch.deposits !== undefined) {
        setValues.deposits = patch.deposits;
      }
      if (patch.withdrawals !== undefined) {
        setValues.withdrawals = patch.withdrawals;
      }
      if (patch.row_count !== undefined) {
        setValues.row_count = patch.row_count;
      }
      if (patch.error_message !== undefined) {
        setValues.error_message = patch.error_message;
      }
      if (patch.completed_at !== undefined) {
        setValues.completed_at = patch.completed_at;
      }
      await this.executor(trx)
        .updateTable('waiv_generated_reports')
        .set(setValues as WaivGeneratedReportUpdate)
        .where('id', '=', id)
        .execute();
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async insertRows(
    rows: NewWaivGeneratedReportStoredRow[],
    trx?: DbExecutor,
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    try {
      const result = await this.executor(trx)
        .insertInto('waiv_generated_report_rows')
        .values(
          rows.map(
            (row) =>
              ({
                report_id: row.report_id,
                operation_index: row.operation_index,
                timestamp: row.timestamp,
                user_name: row.user_name,
                checked: row.checked,
                row: jsonb(row.row),
              }) as NewWaivGeneratedReportStoredRow,
          ),
        )
        .onConflict((oc) => oc.columns(['report_id', 'operation_index']).doNothing())
        .execute();
      return result.length;
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async countRows(reportId: string, trx?: DbExecutor): Promise<number> {
    try {
      const result = await this.executor(trx)
        .selectFrom('waiv_generated_report_rows')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('report_id', '=', reportId)
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async listStoredRows(params: {
    reportId: string;
    skip: number;
    limit: number;
  }): Promise<WaivGeneratedReportStoredRow[]> {
    try {
      return await this.db
        .selectFrom('waiv_generated_report_rows')
        .selectAll()
        .where('report_id', '=', params.reportId)
        .orderBy('timestamp', 'desc')
        .orderBy('id', 'desc')
        .offset(params.skip)
        .limit(params.limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async toggleRowChecked(params: {
    reportId: string;
    operationIndex: number;
    checked: boolean;
  }): Promise<boolean> {
    try {
      await this.db.transaction().execute(async (trx) => {
        const updated = await trx
          .updateTable('waiv_generated_report_rows')
          .set({ checked: params.checked })
          .where('report_id', '=', params.reportId)
          .where('operation_index', '=', params.operationIndex)
          .executeTakeFirst();
        if (Number(updated.numUpdatedRows ?? 0) === 0) {
          throw new Error('row_not_found');
        }
        const totals = await this.recalcTotals(params.reportId, trx);
        await this.updateReport(
          params.reportId,
          {
            deposits: totals.deposits,
            withdrawals: totals.withdrawals,
          },
          trx,
        );
      });
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async deleteByIdAndOwner(id: string, owner: string): Promise<boolean> {
    try {
      const result = await this.db
        .deleteFrom('waiv_generated_reports')
        .where('id', '=', id)
        .where('owner', '=', owner.trim().toLowerCase())
        .executeTakeFirst();
      return Number(result.numDeletedRows ?? 0) > 0;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async recalcTotals(
    reportId: string,
    trx?: DbExecutor,
  ): Promise<{ deposits: number; withdrawals: number }> {
    try {
      const rows = await this.executor(trx)
        .selectFrom('waiv_generated_report_rows')
        .select(['row', 'checked'])
        .where('report_id', '=', reportId)
        .execute();
      const dtoRows = rows.map((entry) => {
        const snapshot = entry.row as WaivAdvancedReportRowDto;
        return {
          withdrawDeposit: snapshot.withdrawDeposit,
          checked: entry.checked,
          totalFiat: snapshot.totalFiat,
        };
      });
      return calcDepositWithdrawals(dtoRows);
    } catch (e) {
      this.logger.error((e as Error).message);
      return { deposits: 0, withdrawals: 0 };
    }
  }
}
