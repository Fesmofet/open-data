import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  matchesActivityFilters,
  resolveHiveAccountHistoryBatchSize,
  resolveHiveAccountHistoryRequestLimit,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow, HiveOperationFilter } from '@opden-data-layer/clients';

import {
  mapHiveAccountHistoryRow,
  type ActivityItemDto,
} from './activity-item-dtos';

/** Keep paging Hive until the page is filled (after filtering hidden ops). */
const ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS = 40;

/** Rare filtered ops may sit deep in history; scan further when filters are active. */
const ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS_WITH_FILTERS = 80;

export type CollectActivityResult = {
  items: ActivityItemDto[];
  /** Oldest not-yet-scanned operation index when paging stopped early; null if history exhausted. */
  resumeFrom: number | null;
};

export type CollectActivityParams = {
  account: string;
  startFrom: number;
  targetCount: number;
  filters: ActivityFilterKey[];
  operationFilter: HiveOperationFilter | null;
};

@Injectable()
export class HiveAccountHistoryPagerService {
  constructor(private readonly hiveClient: HiveClient) {}

  async collectItems(params: CollectActivityParams): Promise<CollectActivityResult> {
    const { account, startFrom, targetCount, filters, operationFilter } = params;
    const pool = new Map<number, ActivityItemDto>();
    let from = startFrom;
    const maxOperationIndex = startFrom >= 0 ? startFrom : undefined;
    let prevFrom = Number.NaN;
    const hiveBatchSize = resolveHiveAccountHistoryBatchSize(filters.length > 0);
    const maxRoundTrips =
      filters.length > 0
        ? ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS_WITH_FILTERS
        : ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS;
    let resumeFrom: number | null = null;

    for (let round = 0; round < maxRoundTrips; round++) {
      if (pool.size >= targetCount) {
        break;
      }

      if (from === prevFrom) {
        break;
      }
      prevFrom = from;

      const requestLimit = resolveHiveAccountHistoryRequestLimit(from, hiveBatchSize);
      const historyPage = await this.hiveClient.getAccountHistory(
        account,
        from,
        requestLimit,
        operationFilter ?? undefined,
      );

      if (historyPage === null) {
        throw new ServiceUnavailableException('Hive account history unavailable');
      }

      const { rows: historyRows, continueFrom } = historyPage;

      if (historyRows.length === 0) {
        if (
          continueFrom !== undefined &&
          continueFrom !== from &&
          continueFrom !== prevFrom
        ) {
          from = continueFrom;
          continue;
        }
        if (operationFilter && from > 0) {
          const nextFrom = Math.max(0, from - requestLimit);
          if (nextFrom === from) {
            break;
          }
          from = nextFrom;
          continue;
        }
        break;
      }

      this.addVisibleRowsToPool(
        historyRows,
        pool,
        account,
        filters,
        maxOperationIndex,
      );

      const oldestInBatch = historyRows[0]?.[0];
      if (oldestInBatch === undefined) {
        break;
      }

      if (pool.size >= targetCount) {
        break;
      }

      if (oldestInBatch <= 0) {
        break;
      }

      from = oldestInBatch;
      if (historyRows.length === 1) {
        from -= 1;
      }

      if (
        historyRows.length < requestLimit &&
        (pool.size >= targetCount || oldestInBatch <= 0)
      ) {
        break;
      }
    }

    if (from > 0 && pool.size < targetCount) {
      resumeFrom = from;
    }

    return {
      items: sortNewestFirst([...pool.values()]).slice(0, targetCount),
      resumeFrom,
    };
  }

  private addVisibleRowsToPool(
    historyRows: HiveAccountHistoryRow[],
    pool: Map<number, ActivityItemDto>,
    profileAccount: string,
    filters: ActivityFilterKey[],
    maxOperationIndex?: number,
  ): void {
    for (const row of historyRows) {
      const [operationIndex] = row;
      if (
        maxOperationIndex !== undefined &&
        operationIndex > maxOperationIndex
      ) {
        continue;
      }

      const item = mapHiveAccountHistoryRow(row);
      if (!item) {
        continue;
      }
      if (
        filters.length > 0 &&
        !matchesActivityFilters(item, filters, profileAccount)
      ) {
        continue;
      }
      pool.set(item.operationIndex, item);
    }
  }
}

function sortNewestFirst(items: ActivityItemDto[]): ActivityItemDto[] {
  return [...items].sort((a, b) => b.operationIndex - a.operationIndex);
}
