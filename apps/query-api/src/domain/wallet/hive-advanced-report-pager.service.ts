import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  getAdvancedReportOperationIndices,
  isAdvancedReportOperation,
} from '@opden-data-layer/core/hive-advanced-report';
import {
  HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE,
  HIVE_OP,
  makeOperationBitMask,
  resolveHiveAccountHistoryRequestLimit,
} from '@opden-data-layer/core/hive-account-history';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow, HiveOperationFilter } from '@opden-data-layer/clients';

import { mapHiveAccountHistoryRow } from '../feed/activity-item-dtos';

const ADVANCED_REPORT_MAX_ROUND_TRIPS = 80;

export type AdvancedReportRawRow = {
  userName: string;
  operationIndex: number;
  timestamp: number;
  /** UTC calendar date for rate lookup (legacy moment.unix on UTC prod). */
  dateYmd: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  memo: string;
  payload: Record<string, unknown>;
};

export type CollectAdvancedReportAccountParams = {
  account: string;
  cursor: number;
  startDate?: number;
  endDate?: number;
  targetCount: number;
  swapAccount?: string;
};

export type CollectAdvancedReportAccountResult = {
  rows: AdvancedReportRawRow[];
  /** Full collected batch (includes limit+1 lookahead) for cursor calculation. */
  pagingRows: AdvancedReportRawRow[];
  hasMore: boolean;
};

function unixFromIso(timestamp: string): number {
  const trimmed = timestamp.trim();
  const iso = trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`;
  return Math.floor(Date.parse(iso) / 1000);
}

/** Legacy `moment.unix(ts).format('YYYY-MM-DD')` on UTC servers. */
function utcYmdFromUnix(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeRow(
  item: NonNullable<ReturnType<typeof mapHiveAccountHistoryRow>>,
  userName: string,
): AdvancedReportRawRow {
  const p = item.payload;
  let from = asString(p.from ?? p.from_account);
  let to = asString(p.to ?? p.to_account);
  let amount = asString(p.amount);

  if (item.type === HIVE_OP.FILL_VESTING_WITHDRAW) {
    from = asString(p.from_account);
    to = asString(p.to_account);
    amount = asString(p.deposited) || amount;
  } else if (item.type === HIVE_OP.INTEREST) {
    amount = asString(p.interest) || amount;
  } else if (item.type === HIVE_OP.PROPOSAL_PAY) {
    amount = asString(p.hbd_payout ?? p.amount);
  } else if (item.type === HIVE_OP.CLAIM_REWARD_BALANCE) {
    amount = [
      asString(p.reward_hive),
      asString(p.reward_hbd),
      asString(p.reward_vests),
    ]
      .filter(Boolean)
      .join(', ');
  } else if (item.type === HIVE_OP.FILL_ORDER) {
    amount = `${asString(p.current_pays)} / ${asString(p.open_pays)}`.trim();
  } else if (item.type === HIVE_OP.LIMIT_ORDER_CANCEL) {
    amount = `${asString(p.open_pays)} / ${asString(p.current_pays)}`.trim();
  }

  const unix = unixFromIso(item.timestamp);
  return {
    userName,
    operationIndex: item.operationIndex,
    timestamp: unix,
    dateYmd: utcYmdFromUnix(unix),
    type: item.type,
    from,
    to,
    amount,
    memo: asString(p.memo),
    payload: p,
  };
}

function shouldSkipSwap(
  item: NonNullable<ReturnType<typeof mapHiveAccountHistoryRow>>,
  swapAccount: string | undefined,
): boolean {
  if (!swapAccount || item.type !== HIVE_OP.TRANSFER) {
    return false;
  }
  const swap = swapAccount.trim().toLowerCase();
  const from = asString(item.payload.from).trim().toLowerCase();
  const to = asString(item.payload.to).trim().toLowerCase();
  return from === swap || to === swap;
}

@Injectable()
export class HiveAdvancedReportPagerService {
  private readonly operationFilter: HiveOperationFilter;

  constructor(private readonly hiveClient: HiveClient) {
    this.operationFilter = makeOperationBitMask(getAdvancedReportOperationIndices());
  }

  async collectForAccount(
    params: CollectAdvancedReportAccountParams,
  ): Promise<CollectAdvancedReportAccountResult> {
    const { account, cursor, startDate, endDate, targetCount, swapAccount } = params;
    const collected: AdvancedReportRawRow[] = [];
    const seen = new Set<number>();
    let from = cursor;
    let prevFrom = Number.NaN;
    let hasMore = false;

    for (let round = 0; round < ADVANCED_REPORT_MAX_ROUND_TRIPS; round++) {
      if (collected.length > targetCount) {
        hasMore = true;
        break;
      }
      if (from === prevFrom) {
        break;
      }
      prevFrom = from;

      const requestLimit = resolveHiveAccountHistoryRequestLimit(
        from,
        HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE,
      );
      const page = await this.hiveClient.getAccountHistory(
        account.trim().toLowerCase(),
        from,
        requestLimit,
        this.operationFilter,
      );

      if (page === null) {
        throw new ServiceUnavailableException('Hive account history unavailable');
      }

      const { rows: historyRows, continueFrom } = page;
      if (historyRows.length === 0) {
        if (
          continueFrom !== undefined &&
          continueFrom !== from &&
          continueFrom !== prevFrom
        ) {
          from = continueFrom;
          continue;
        }
        if (from > 0) {
          from = Math.max(0, from - requestLimit);
          continue;
        }
        break;
      }

      const sortedAsc = sortAsc(historyRows);
      const batchNewestFirst = [...sortedAsc].reverse();
      let reachedStartDate = false;

      for (const hiveRow of batchNewestFirst) {
        const item = mapHiveAccountHistoryRow(hiveRow);
        if (!item || !isAdvancedReportOperation(item.type)) {
          continue;
        }
        const ts = unixFromIso(item.timestamp);
        if (endDate !== undefined && ts > endDate) {
          continue;
        }
        if (startDate !== undefined && ts < startDate) {
          reachedStartDate = true;
          break;
        }
        if (shouldSkipSwap(item, swapAccount)) {
          continue;
        }
        if (seen.has(item.operationIndex)) {
          continue;
        }

        collected.push(normalizeRow(item, account.trim().toLowerCase()));
        seen.add(item.operationIndex);
        if (collected.length > targetCount) {
          hasMore = true;
          break;
        }
      }

      if (reachedStartDate || collected.length > targetCount) {
        if (collected.length > targetCount) {
          hasMore = true;
        }
        break;
      }

      const oldestInBatch = sortedAsc[0]?.[0];
      if (oldestInBatch === undefined) {
        break;
      }
      if (oldestInBatch <= 0) {
        break;
      }

      from = Math.max(0, oldestInBatch - 1);

      if (
        historyRows.length < requestLimit &&
        (collected.length > targetCount || oldestInBatch <= 0)
      ) {
        break;
      }
    }

    if (collected.length > targetCount) {
      hasMore = true;
    }

    return {
      rows: collected.slice(0, targetCount),
      pagingRows: collected,
      hasMore,
    };
  }
}

function sortAsc(rows: HiveAccountHistoryRow[]): HiveAccountHistoryRow[] {
  return [...rows].sort((a, b) => a[0] - b[0]);
}
