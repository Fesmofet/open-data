import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
} from '@opden-data-layer/core/hive-account-history';
import { HiveClient } from '@opden-data-layer/clients';
import type { HiveAccountHistoryRow } from '@opden-data-layer/clients';

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

/** Per Hive node: `get_account_history` rows are oldest-first; last row is newest. */
const HIVE_HISTORY_REQUEST_SIZE = 100;

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

    const pageLimit = body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE;
    const from = cursorPayload?.operationIndex ?? -1;
    const collected = await this.collectActivityItems(
      profileAccountName,
      from,
      pageLimit + 1,
    );

    const pageItems = collected.slice(0, pageLimit);
    const hasMore = collected.length > pageLimit;
    const oldestInPage = pageItems[pageItems.length - 1];
    const cursor =
      hasMore && oldestInPage && oldestInPage.operationIndex > 0
        ? encodeActivityCursor({ operationIndex: oldestInPage.operationIndex - 1 })
        : null;

    const globalProps = await this.hiveClient.getDynamicGlobalProperties();

    return {
      items: pageItems,
      cursor,
      hasMore,
      chainContext: {
        totalVestingShares:
          globalProps?.total_vesting_shares ?? DEFAULT_CHAIN_CONTEXT.totalVestingShares,
        totalVestingFundSteem:
          globalProps?.total_vesting_fund_steem ??
          DEFAULT_CHAIN_CONTEXT.totalVestingFundSteem,
      },
    };
  }

  private async collectActivityItems(
    account: string,
    startFrom: number,
    targetCount: number,
  ): Promise<ActivityItemDto[]> {
    const pool = new Map<number, ActivityItemDto>();
    let from = startFrom;
    const maxOperationIndex = startFrom >= 0 ? startFrom : undefined;
    let prevFrom = Number.NaN;

    for (let round = 0; round < ACTIVITY_FEED_MAX_HIVE_ROUND_TRIPS; round++) {
      if (pool.size >= targetCount) {
        break;
      }

      if (from === prevFrom) {
        break;
      }
      prevFrom = from;

      const historyRows = await this.hiveClient.getAccountHistory(
        account,
        from,
        HIVE_HISTORY_REQUEST_SIZE,
      );

      if (historyRows === null) {
        throw new ServiceUnavailableException('Hive account history unavailable');
      }

      if (historyRows.length === 0) {
        break;
      }

      this.addVisibleRowsToPool(historyRows, pool, maxOperationIndex);

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
        historyRows.length < HIVE_HISTORY_REQUEST_SIZE &&
        (pool.size >= targetCount || oldestInBatch <= 0)
      ) {
        break;
      }
    }

    return sortNewestFirst([...pool.values()]).slice(0, targetCount);
  }

  private addVisibleRowsToPool(
    historyRows: HiveAccountHistoryRow[],
    pool: Map<number, ActivityItemDto>,
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
      pool.set(item.operationIndex, item);
    }
  }
}

function sortNewestFirst(items: ActivityItemDto[]): ActivityItemDto[] {
  return [...items].sort((a, b) => b.operationIndex - a.operationIndex);
}
