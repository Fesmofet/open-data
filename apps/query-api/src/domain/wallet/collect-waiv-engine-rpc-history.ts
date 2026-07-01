import type { HiveEngineAccountHistoryEntry } from '@opden-data-layer/clients';

import { buildRpcHistoryTieId } from './waiv-wallet-history-item-dtos';

export const WAIV_ENGINE_RPC_MAX_ROUND_TRIPS = 20;

function rpcEntryKey(entry: HiveEngineAccountHistoryEntry): string {
  return `${entry.timestamp}:${buildRpcHistoryTieId(entry)}`;
}

export type FetchWaivEngineRpcHistoryBatch = (
  batchLimit: number,
  timestampEnd: number | undefined,
  timestampStart: number | undefined,
  offset: number,
) => Promise<{ entries: HiveEngineAccountHistoryEntry[]; unavailable: boolean }>;

export async function collectWaivEngineRpcHistory(params: {
  limit: number;
  timestampStart: number;
  initialTimestampEnd: number | undefined;
  fetchBatch: FetchWaivEngineRpcHistoryBatch;
}): Promise<{
  entries: HiveEngineAccountHistoryEntry[];
  unavailable: boolean;
  hasMore: boolean;
}> {
  const collected: HiveEngineAccountHistoryEntry[] = [];
  const seenKeys = new Set<string>();
  let unavailable = false;
  let hasMore = false;
  let timestampEnd = params.initialTimestampEnd;
  let offset = 0;

  const appendUnique = (entries: readonly HiveEngineAccountHistoryEntry[]): number => {
    let added = 0;
    for (const entry of entries) {
      const key = rpcEntryKey(entry);
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      collected.push(entry);
      added += 1;
    }
    return added;
  };

  for (let round = 0; round < WAIV_ENGINE_RPC_MAX_ROUND_TRIPS; round++) {
    if (collected.length >= params.limit) {
      hasMore = true;
      break;
    }

    const batchLimit = params.limit - collected.length;
    const result = await params.fetchBatch(
      batchLimit,
      timestampEnd,
      params.timestampStart,
      offset,
    );

    if (result.unavailable) {
      unavailable = true;
      break;
    }

    if (result.entries.length === 0) {
      break;
    }

    const added = appendUnique(result.entries);
    if (added === 0) {
      break;
    }

    const oldestInBatch = result.entries[result.entries.length - 1]!;
    const allSameTimestamp = result.entries.every(
      (entry) => entry.timestamp === oldestInBatch.timestamp,
    );

    if (allSameTimestamp) {
      if (timestampEnd === undefined) {
        timestampEnd = oldestInBatch.timestamp;
      }
      if (
        oldestInBatch.timestamp === timestampEnd &&
        (result.entries.length >= batchLimit || offset === 0)
      ) {
        offset += result.entries.length;
        hasMore = true;
        continue;
      }
    }

    if (result.entries.length < batchLimit) {
      break;
    }

    offset = 0;
    timestampEnd = oldestInBatch.timestamp;
    hasMore = true;
  }

  return { entries: collected, unavailable, hasMore };
}
