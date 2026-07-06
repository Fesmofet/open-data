import type { HiveEngineAccountHistoryEntry } from '@opden-data-layer/clients';
import { ENGINE_HISTORY_EXCLUDED_SYMBOLS } from '@opden-data-layer/core/hive-engine-history';

import type { WaivWalletHistoryItemDto } from './waiv-wallet-history-item-dtos';

const EXCLUDED = new Set<string>(ENGINE_HISTORY_EXCLUDED_SYMBOLS);

export function isEngineHistoryRpcEntryExcluded(
  entry: HiveEngineAccountHistoryEntry,
): boolean {
  return EXCLUDED.has(entry.symbol);
}

export function isEngineHistoryItemExcluded(
  item: WaivWalletHistoryItemDto,
): boolean {
  if (item.source !== 'rpc') {
    return false;
  }
  const sym = item.payload.symbol;
  return typeof sym === 'string' && EXCLUDED.has(sym);
}

export function filterEngineHistoryItems(
  items: readonly WaivWalletHistoryItemDto[],
): WaivWalletHistoryItemDto[] {
  return items.filter((item) => !isEngineHistoryItemExcluded(item));
}
