import { Injectable } from '@nestjs/common';
import {
  HiveEngineHistoryClient,
  type HiveEngineAccountHistoryEntry,
} from '@opden-data-layer/clients';
import {
  buildWaivWalletHistoryRpcOps,
  ENGINE_HISTORY_EXCLUDED_SYMBOLS,
  WAIV_WALLET_HISTORY_BUFFER,
} from '@opden-data-layer/core/hive-engine-history';

import { HiveEngineSwapsRepository } from '../../repositories';
import {
  decodeWaivWalletHistoryCursor,
  encodeWaivWalletHistoryCursor,
  isWaivHistoryRowOlderThan,
  rowCursorFromParts,
  type WaivWalletHistoryCursorPayload,
} from './waiv-wallet-history-cursor';
import {
  itemCursorParts,
  mapRpcHistoryEntry,
  mapSwapRow,
  type WaivWalletHistoryItemDto,
} from './waiv-wallet-history-item-dtos';
import { collectWaivEngineRpcHistory, ENGINE_WALLET_RPC_MAX_ROUND_TRIPS } from './collect-waiv-engine-rpc-history';
import {
  filterEngineHistoryItems,
  isEngineHistoryRpcEntryExcluded,
} from './engine-wallet-history-filter';

export type CollectEngineWalletHistoryParams = {
  account: string;
  limit: number;
  cursor: string | null;
};

export type CollectEngineWalletHistoryResult = {
  items: WaivWalletHistoryItemDto[];
  cursor: string | null;
  hasMore: boolean;
  rpcUnavailable: boolean;
};

@Injectable()
export class EngineWalletHistoryPagerService {
  constructor(
    private readonly historyClient: HiveEngineHistoryClient,
    private readonly swapsRepo: HiveEngineSwapsRepository,
  ) {}

  async collectPage(
    params: CollectEngineWalletHistoryParams,
  ): Promise<CollectEngineWalletHistoryResult> {
    const cursorPayload = params.cursor
      ? decodeWaivWalletHistoryCursor(params.cursor)
      : null;
    const fetchLimit = params.limit + WAIV_WALLET_HISTORY_BUFFER;

    const [rpcResult, swaps] = await Promise.all([
      this.collectRpcRows({
        account: params.account,
        limit: fetchLimit,
        cursor: cursorPayload,
      }),
      this.swapsRepo.findByAccount(
        params.account,
        fetchLimit,
        cursorPayload?.timestamp ?? null,
      ),
    ]);

    const merged = filterEngineHistoryItems([
      ...rpcResult.entries.map(mapRpcHistoryEntry),
      ...swaps.map(mapSwapRow),
    ]);

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
    cursor: WaivWalletHistoryCursorPayload | null;
  }): Promise<{ entries: HiveEngineAccountHistoryEntry[]; unavailable: boolean }> {
    const ops = buildWaivWalletHistoryRpcOps(false);
    const timestampEnd = params.cursor?.timestamp;

    const result = await collectWaivEngineRpcHistory({
      limit: params.limit,
      timestampStart: 1,
      initialTimestampEnd: timestampEnd,
      maxRoundTrips: ENGINE_WALLET_RPC_MAX_ROUND_TRIPS,
      acceptEntry: (entry) => !isEngineHistoryRpcEntryExcluded(entry),
      fetchBatch: async (batchLimit, tsEnd, tsStart, offset) => {
        return this.historyClient.accountHistoryWithStatus({
          account: params.account,
          excludeSymbols: [...ENGINE_HISTORY_EXCLUDED_SYMBOLS],
          ops,
          limit: batchLimit,
          ...(tsEnd !== undefined && {
            timestampEnd: tsEnd,
            timestampStart: tsStart,
          }),
          ...(offset > 0 ? { offset } : {}),
        });
      },
    });

    return { entries: result.entries, unavailable: result.unavailable };
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
