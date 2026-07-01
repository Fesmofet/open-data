import { Injectable } from '@nestjs/common';
import {
  HiveEngineHistoryClient,
  type HiveEngineAccountHistoryEntry,
} from '@opden-data-layer/clients';
import {
  buildWaivAdvancedReportRpcOps,
  classifyWaivWithdrawDeposit,
  isWaivAdvancedReportPgSwapEnabled,
  stableWaivAdvancedReportOperationIndex,
} from '@opden-data-layer/core/waiv-advanced-report';
import { WAIV_WALLET_HISTORY_BUFFER } from '@opden-data-layer/core/hive-engine-history';

import {
  HiveEngineSwapsRepository,
  HiveEngineWaivAirdropsRepository,
} from '../../repositories';
import {
  compareWaivHistoryCursorsDesc,
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
import { collectWaivEngineRpcHistory } from './collect-waiv-engine-rpc-history';
import { WAIV_SYMBOL } from './schemas/waiv-wallet.schema';

function utcYmdFromUnix(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export type WaivAdvancedReportRawRow = {
  userName: string;
  operationIndex: number;
  timestamp: number;
  dateYmd: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  memo: string;
  withdrawDeposit: 'd' | 'w';
  payload: Record<string, unknown>;
  cursor: string;
};

export type CollectWaivAdvancedReportAccountParams = {
  account: string;
  cursor: string | null;
  startDate?: number;
  endDate?: number;
  targetCount: number;
  includeSwapsAndTrades: boolean;
  filterAccounts: readonly string[];
};

export type CollectWaivAdvancedReportAccountResult = {
  rows: WaivAdvancedReportRawRow[];
  pagingRows: WaivAdvancedReportRawRow[];
  hasMore: boolean;
  lastCursor: string | null;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function resolveWaivQuantity(
  operation: string,
  payload: Record<string, unknown>,
): string {
  const quantity = asString(payload.quantity).trim();
  if (quantity) {
    return quantity;
  }
  const symbolIn = asString(payload.symbolIn).trim().toUpperCase();
  const symbolInQty = asString(payload.symbolInQuantity).trim();
  const symbolOutQty = asString(payload.symbolOutQuantity).trim();
  if (symbolInQty || symbolOutQty) {
    return symbolIn === WAIV_SYMBOL ? symbolInQty : symbolOutQty;
  }
  const quantityTokens = asString(payload.quantityTokens).trim();
  if (quantityTokens) {
    return quantityTokens;
  }
  if (operation === 'marketpools_swapTokens') {
    return symbolOutQty || symbolInQty;
  }
  return '';
}

function itemToRawRow(
  item: WaivWalletHistoryItemDto,
  account: string,
  filterAccounts: readonly string[],
): WaivAdvancedReportRawRow | null {
  const parts = itemCursorParts(item);
  const payload = item.payload;
  const from = asString(payload.from ?? payload.account);
  const to = asString(payload.to ?? payload.account);
  const record = {
    type: item.operation,
    from,
    to,
    symbolOut: asString(payload.symbolOut),
  };
  const withdrawDeposit = classifyWaivWithdrawDeposit({
    type: item.operation,
    record,
    userName: account,
    filterAccounts,
    waivSymbol: WAIV_SYMBOL,
  });
  if (withdrawDeposit === '') {
    return null;
  }

  const cursorPayload = rowCursorFromParts(
    parts.timestamp,
    parts.tieId,
    parts.source,
  );
  const operationIndex = stableWaivAdvancedReportOperationIndex({
    source: parts.source,
    account,
    timestamp: parts.timestamp,
    tieId: parts.tieId,
  });

  return {
    userName: account,
    operationIndex,
    timestamp: parts.timestamp,
    dateYmd: utcYmdFromUnix(parts.timestamp),
    type: item.operation,
    from,
    to,
    amount: resolveWaivQuantity(item.operation, payload),
    memo: asString(payload.memo),
    withdrawDeposit,
    payload,
    cursor: encodeWaivWalletHistoryCursor(cursorPayload),
  };
}

function cursorFromRawRow(row: WaivAdvancedReportRawRow): WaivWalletHistoryCursorPayload {
  return decodeWaivWalletHistoryCursor(row.cursor) ?? rowCursorFromParts(row.timestamp, String(row.operationIndex), 'rpc');
}

function sortRawRows(rows: WaivAdvancedReportRawRow[]): WaivAdvancedReportRawRow[] {
  return [...rows].sort((a, b) =>
    compareWaivHistoryCursorsDesc(cursorFromRawRow(a), cursorFromRawRow(b)),
  );
}

@Injectable()
export class WaivAdvancedReportPagerService {
  constructor(
    private readonly historyClient: HiveEngineHistoryClient,
    private readonly swapsRepo: HiveEngineSwapsRepository,
    private readonly airdropsRepo: HiveEngineWaivAirdropsRepository,
  ) {}

  async collectForAccount(
    params: CollectWaivAdvancedReportAccountParams,
  ): Promise<CollectWaivAdvancedReportAccountResult> {
    const cursorPayload = params.cursor
      ? decodeWaivWalletHistoryCursor(params.cursor)
      : null;
    const fetchLimit = params.targetCount + WAIV_WALLET_HISTORY_BUFFER;
    const dateRange =
      params.startDate !== undefined && params.endDate !== undefined
        ? { startDate: params.startDate, endDate: params.endDate }
        : undefined;

    const includeSwaps = isWaivAdvancedReportPgSwapEnabled(
      params.includeSwapsAndTrades,
    );

    const [rpcResult, swaps, airdrops] = await Promise.all([
      this.collectRpcRows({
        account: params.account,
        limit: fetchLimit,
        includeSwapsAndTrades: params.includeSwapsAndTrades,
        cursor: cursorPayload,
        dateRange,
      }),
      includeSwaps
        ? this.swapsRepo.findWaivByAccount(
            params.account,
            fetchLimit,
            cursorPayload?.timestamp ?? null,
            dateRange,
          )
        : Promise.resolve([]),
      this.airdropsRepo.findByAccount(
        params.account,
        fetchLimit,
        cursorPayload?.timestamp ?? null,
        dateRange,
      ),
    ]);

    const mergedItems = [
      ...rpcResult.entries.map(mapRpcHistoryEntry),
      ...swaps.map(mapSwapRow),
      ...airdrops.map(mapAirdropRow),
    ];

    const sortedItems = sortHistoryItems(mergedItems);
    const filteredItems = cursorPayload
      ? sortedItems.filter((item) => {
          const parts = itemCursorParts(item);
          const rowCursor = rowCursorFromParts(
            parts.timestamp,
            parts.tieId,
            parts.source,
          );
          return isWaivHistoryRowOlderThan(rowCursor, cursorPayload);
        })
      : sortedItems;

    const rawCandidates = filteredItems
      .map((item) => itemToRawRow(item, params.account, params.filterAccounts))
      .filter((row): row is WaivAdvancedReportRawRow => row != null);

    const dateFiltered = dateRange
      ? rawCandidates.filter(
          (row) =>
            row.timestamp >= dateRange.startDate &&
            row.timestamp <= dateRange.endDate,
        )
      : rawCandidates;

    const sorted = sortRawRows(dateFiltered);
    const pageLimit = params.targetCount - 1;
    const hasMore = sorted.length >= params.targetCount || rpcResult.hasMore;
    const rows = sorted.slice(0, pageLimit);
    const pagingRows = sorted.slice(0, params.targetCount);
    const lastItem = rows.at(-1);
    const lastCursor = lastItem?.cursor ?? null;

    return {
      rows,
      pagingRows,
      hasMore,
      lastCursor,
    };
  }

  private async collectRpcRows(params: {
    account: string;
    limit: number;
    includeSwapsAndTrades: boolean;
    cursor: WaivWalletHistoryCursorPayload | null;
    dateRange?: { startDate: number; endDate: number };
  }): Promise<{
    entries: HiveEngineAccountHistoryEntry[];
    unavailable: boolean;
    hasMore: boolean;
  }> {
    const ops = buildWaivAdvancedReportRpcOps(params.includeSwapsAndTrades);
    const timestampStart = params.dateRange?.startDate ?? 1;
    const initialTimestampEnd = params.dateRange
      ? (params.cursor?.timestamp ?? params.dateRange.endDate)
      : params.cursor?.timestamp;

    return collectWaivEngineRpcHistory({
      limit: params.limit,
      timestampStart,
      initialTimestampEnd,
      fetchBatch: async (batchLimit, timestampEnd, tsStart, offset) => {
        const result = await this.historyClient.accountHistoryWithStatus({
          account: params.account,
          symbol: WAIV_SYMBOL,
          ops,
          limit: batchLimit,
          ...(timestampEnd !== undefined
            ? { timestampEnd, timestampStart: tsStart }
            : {}),
          ...(offset > 0 ? { offset } : {}),
        });
        return result;
      },
    });
  }
}

function sortHistoryItems(
  items: WaivWalletHistoryItemDto[],
): WaivWalletHistoryItemDto[] {
  return [...items].sort((a, b) => {
    const aParts = itemCursorParts(a);
    const bParts = itemCursorParts(b);
    return compareWaivHistoryCursorsDesc(
      rowCursorFromParts(aParts.timestamp, aParts.tieId, aParts.source),
      rowCursorFromParts(bParts.timestamp, bParts.tieId, bParts.source),
    );
  });
}
