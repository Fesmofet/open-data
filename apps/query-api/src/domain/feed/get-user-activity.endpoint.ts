import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  buildActivityFilterMask,
  matchesActivityFilters,
  resolveHiveAccountHistoryBatchSize,
  resolveHiveAccountHistoryRequestLimit,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow, HiveOperationFilter } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import {
  decodeActivityCursor,
  encodeActivityCursor,
} from './activity-cursor';
import {
  mapHiveAccountHistoryRow,
  type ActivityItemDto,
  type UserActivityResponse,
} from './activity-item-dtos';
import type { UserActivityBody } from './schemas/user-activity.schema';

const DEFAULT_CHAIN_CONTEXT = {
  totalVestingShares: '0',
  totalVestingFundSteem: '0',
} as const;

/** Keep paging Hive until the page is filled (after filtering hidden ops). */
const ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS = 40;

/** Rare filtered ops may sit deep in history; scan further when filters are active. */
const ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS_WITH_FILTERS = 80;

type CollectActivityResult = {
  items: ActivityItemDto[];
  /** Oldest not-yet-scanned operation index when paging stopped early; null if history exhausted. */
  resumeFrom: number | null;
};

@Injectable()
export class GetUserActivityEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly hiveClient: HiveClient,
  ) {}

  async execute(
    profileAccountName: string,
    body: UserActivityBody,
  ): Promise<UserActivityResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const cursorPayload = body.cursor ? decodeActivityCursor(body.cursor) : null;
    if (body.cursor && !cursorPayload) {
      throw new BadRequestException('Invalid activity cursor');
    }

    const filters = body.filters ?? [];
    const operationFilter = buildActivityFilterMask(filters);
    const pageLimit = body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE;
    const from = cursorPayload?.operationIndex ?? -1;
    const collected = await this.collectActivityItems(
      profileAccountName,
      from,
      pageLimit + 1,
      filters,
      operationFilter,
    );

    const pageItems = collected.items.slice(0, pageLimit);
    const hasMoreItems = collected.items.length > pageLimit;
    const canScanFurther =
      collected.resumeFrom !== null && collected.resumeFrom > 0;
    const hasMore = hasMoreItems || (pageItems.length < pageLimit && canScanFurther);
    const oldestInPage = pageItems[pageItems.length - 1];
    const cursor = hasMoreItems
      ? oldestInPage && oldestInPage.operationIndex > 0
        ? encodeActivityCursor({ operationIndex: oldestInPage.operationIndex - 1 })
        : null
      : canScanFurther && collected.resumeFrom !== null
        ? encodeActivityCursor({ operationIndex: collected.resumeFrom })
        : null;

    const globalProps = await this.hiveClient.getDynamicGlobalProperties();
    const totalVestingFund =
      globalProps?.total_vesting_fund_hive ??
      globalProps?.total_vesting_fund_steem ??
      DEFAULT_CHAIN_CONTEXT.totalVestingFundSteem;

    return {
      items: pageItems,
      cursor,
      hasMore,
      chainContext: {
        totalVestingShares:
          globalProps?.total_vesting_shares ?? DEFAULT_CHAIN_CONTEXT.totalVestingShares,
        totalVestingFundSteem: totalVestingFund,
      },
    };
  }

  private async collectActivityItems(
    account: string,
    startFrom: number,
    targetCount: number,
    filters: ActivityFilterKey[],
    operationFilter: HiveOperationFilter | null,
  ): Promise<CollectActivityResult> {
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
