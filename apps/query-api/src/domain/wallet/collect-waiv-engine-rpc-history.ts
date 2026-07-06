import type { HiveEngineAccountHistoryEntry } from '@opden-data-layer/clients';

import { buildRpcHistoryTieId } from './waiv-wallet-history-item-dtos';

export const WAIV_ENGINE_RPC_MAX_ROUND_TRIPS = 20;
/** Higher cap when RPC batches are mostly filtered (ENGINE tab excludes WAIV). */
export const ENGINE_WALLET_RPC_MAX_ROUND_TRIPS = 100;

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
  acceptEntry?: (entry: HiveEngineAccountHistoryEntry) => boolean;
  maxRoundTrips?: number;
}): Promise<{
  entries: HiveEngineAccountHistoryEntry[];
  unavailable: boolean;
  hasMore: boolean;
}> {
  const collected: HiveEngineAccountHistoryEntry[] = [];
  const seenKeys = new Set<string>();
  const shouldAccept = params.acceptEntry ?? (() => true);
  const maxRoundTrips =
    params.maxRoundTrips ?? WAIV_ENGINE_RPC_MAX_ROUND_TRIPS;
  let unavailable = false;
  let hasMore = false;
  let timestampEnd = params.initialTimestampEnd;
  let offset = 0;

  const appendUnique = (entries: readonly HiveEngineAccountHistoryEntry[]): number => {
    let added = 0;
    for (const entry of entries) {
      if (!shouldAccept(entry)) {
        continue;
      }
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

  const advancePagination = (
    entries: readonly HiveEngineAccountHistoryEntry[],
    batchLimit: number,
  ): boolean => {
    const oldestInBatch = entries[entries.length - 1];
    if (!oldestInBatch) {
      return false;
    }

    const allSameTimestamp = entries.every(
      (entry) => entry.timestamp === oldestInBatch.timestamp,
    );

    if (allSameTimestamp) {
      if (timestampEnd === undefined) {
        timestampEnd = oldestInBatch.timestamp;
      }
      if (
        oldestInBatch.timestamp === timestampEnd &&
        (entries.length >= batchLimit || offset === 0)
      ) {
        offset += entries.length;
        hasMore = true;
        return true;
      }
    }

    if (entries.length < batchLimit) {
      return false;
    }

    offset = 0;
    timestampEnd = oldestInBatch.timestamp;
    hasMore = true;
    return true;
  };

  for (let round = 0; round < maxRoundTrips; round++) {
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
      if (!advancePagination(result.entries, batchLimit)) {
        break;
      }
      continue;
    }

    if (!advancePagination(result.entries, batchLimit)) {
      break;
    }
  }

  return { entries: collected, unavailable, hasMore };
}
