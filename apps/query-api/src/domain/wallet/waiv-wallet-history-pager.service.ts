import { Injectable } from '@nestjs/common';
import {
  HiveEngineHistoryClient,
  type HiveEngineAccountHistoryEntry,
} from '@opden-data-layer/clients';
import {
  buildWaivWalletHistoryRpcOps,
  WAIV_WALLET_HISTORY_BUFFER,
} from '@opden-data-layer/core/hive-engine-history';

import {
  HiveEngineSwapsRepository,
  HiveEngineWaivAirdropsRepository,
} from '../../repositories';
import {
  decodeWaivWalletHistoryCursor,
  encodeWaivWalletHistoryCursor,
  isWaivHistoryRowOlderThan,
  rowCursorFromParts,
  type WaivWalletHistoryCursorPayload,
} from './waiv-wallet-history-cursor';
import {
  itemCursorParts,
  mapAirdropRow,
  mapRpcHistoryEntry,
  mapSwapRow,
  type WaivWalletHistoryItemDto,
} from './waiv-wallet-history-item-dtos';
import { WAIV_SYMBOL } from './schemas/waiv-wallet.schema';

const RPC_MAX_ROUND_TRIPS = 20;

export type CollectWaivWalletHistoryParams = {
  account: string;
  limit: number;
  cursor: string | null;
  showRewards: boolean;
};

export type CollectWaivWalletHistoryResult = {
  items: WaivWalletHistoryItemDto[];
  cursor: string | null;
  hasMore: boolean;
  rpcUnavailable: boolean;
};

@Injectable()
export class WaivWalletHistoryPagerService {
  constructor(
    private readonly historyClient: HiveEngineHistoryClient,
    private readonly swapsRepo: HiveEngineSwapsRepository,
    private readonly airdropsRepo: HiveEngineWaivAirdropsRepository,
  ) {}

  async collectPage(
    params: CollectWaivWalletHistoryParams,
  ): Promise<CollectWaivWalletHistoryResult> {
    const cursorPayload = params.cursor
      ? decodeWaivWalletHistoryCursor(params.cursor)
      : null;
    const fetchLimit = params.limit + WAIV_WALLET_HISTORY_BUFFER;

    const [rpcResult, swaps, airdrops] = await Promise.all([
      this.collectRpcRows({
        account: params.account,
        limit: fetchLimit,
        showRewards: params.showRewards,
        cursor: cursorPayload,
      }),
      this.swapsRepo.findWaivByAccount(
        params.account,
        fetchLimit,
        cursorPayload?.timestamp ?? null,
      ),
      this.airdropsRepo.findByAccount(
        params.account,
        fetchLimit,
        cursorPayload?.timestamp ?? null,
      ),
    ]);

    const merged = [
      ...rpcResult.entries.map(mapRpcHistoryEntry),
      ...swaps.map(mapSwapRow),
      ...airdrops.map(mapAirdropRow),
    ];

    const sorted = sortHistoryItems(merged);
    const filtered = cursorPayload
      ? sorted.filter((item) => {
          const parts = itemCursorParts(item);
          const rowCursor = rowCursorFromParts(
            parts.timestamp,
            parts.tieId,
            parts.source,
          );
          return isWaivHistoryRowOlderThan(rowCursor, cursorPayload);
        })
      : sorted;

    const pagePlusOne = filtered.slice(0, params.limit + 1);
    const hasMore = pagePlusOne.length > params.limit;
    const pageItems = pagePlusOne.slice(0, params.limit);
    const lastItem = pageItems[pageItems.length - 1];
    const lastParts = lastItem ? itemCursorParts(lastItem) : null;
    const cursor =
      hasMore && lastParts
        ? encodeWaivWalletHistoryCursor(
            rowCursorFromParts(
              lastParts.timestamp,
              lastParts.tieId,
              lastParts.source,
            ),
          )
        : null;

    return {
      items: pageItems,
      cursor,
      hasMore,
      rpcUnavailable: rpcResult.unavailable,
    };
  }

  private async collectRpcRows(params: {
    account: string;
    limit: number;
    showRewards: boolean;
    cursor: WaivWalletHistoryCursorPayload | null;
  }): Promise<{ entries: HiveEngineAccountHistoryEntry[]; unavailable: boolean }> {
    const ops = buildWaivWalletHistoryRpcOps(params.showRewards);
    const collected: HiveEngineAccountHistoryEntry[] = [];
    let timestampEnd = params.cursor?.timestamp;
    let unavailable = false;

    for (let round = 0; round < RPC_MAX_ROUND_TRIPS; round++) {
      if (collected.length >= params.limit) {
        break;
      }

      const batchLimit = params.limit - collected.length;
      const result = await this.historyClient.accountHistoryWithStatus({
        account: params.account,
        symbol: WAIV_SYMBOL,
        ops,
        limit: batchLimit,
        ...(timestampEnd !== undefined && {
          timestampEnd,
          timestampStart: 1,
        }),
      });

      if (result.unavailable) {
        unavailable = true;
        break;
      }

      if (result.entries.length === 0) {
        break;
      }

      collected.push(...result.entries);

      if (result.entries.length < batchLimit) {
        break;
      }

      const oldest = result.entries[result.entries.length - 1];
      if (oldest.timestamp === timestampEnd) {
        break;
      }
      timestampEnd = oldest.timestamp;
    }

    return { entries: collected, unavailable };
  }
}

function sortHistoryItems(
  items: WaivWalletHistoryItemDto[],
): WaivWalletHistoryItemDto[] {
  return [...items].sort((a, b) => {
    const aParts = itemCursorParts(a);
    const bParts = itemCursorParts(b);
    const aCursor = rowCursorFromParts(
      aParts.timestamp,
      aParts.tieId,
      aParts.source,
    );
    const bCursor = rowCursorFromParts(
      bParts.timestamp,
      bParts.tieId,
      bParts.source,
    );
    if (isWaivHistoryRowOlderThan(aCursor, bCursor)) {
      return 1;
    }
    if (isWaivHistoryRowOlderThan(bCursor, aCursor)) {
      return -1;
    }
    return 0;
  });
}
