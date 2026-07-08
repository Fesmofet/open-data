import type { HiveEngineMarketPool } from '@opden-data-layer/clients';

import {
  ENGINE_POOL_PAIR_BY_SYMBOL,
  HBD_HIVE_SWAP_POOL,
} from './currency.constants';

function pairMapFromPools(
  pools: readonly HiveEngineMarketPool[],
): Map<string, HiveEngineMarketPool> {
  return new Map(pools.map((pool) => [pool.tokenPair, pool]));
}

function hiveUsdFromHbdSwapPool(
  hbdSwap: HiveEngineMarketPool | undefined,
  hiveUsd: number,
  hbdUsd: number,
): number {
  if (!hbdSwap?.baseQuantity || !hbdSwap?.quoteQuantity) {
    return hiveUsd;
  }

  const viaPool =
    (Number.parseFloat(hbdSwap.quoteQuantity) * hbdUsd) /
    Number.parseFloat(hbdSwap.baseQuantity);

  if (Number.isFinite(viaPool) && viaPool > 0) {
    return viaPool;
  }

  return hiveUsd;
}

/** Derive SWAP.* USD prices from market pool rows + HIVE/HBD spot (scheduler ingestion). */
export function computeSwapPoolUsdRows(params: {
  pools: readonly HiveEngineMarketPool[];
  hiveUsd: number;
  hbdUsd: number;
  symbols: readonly string[];
}): Array<{ symbol: string; USD: number }> {
  const { pools, symbols } = params;
  const hiveUsd = params.hiveUsd > 0 ? params.hiveUsd : 0;
  const hbdUsd = params.hbdUsd > 0 ? params.hbdUsd : 1;

  if (hiveUsd <= 0 || symbols.length === 0) {
    return [];
  }

  const pairLookup = pairMapFromPools(pools);
  const hbdPool = pools.find((pool) => pool.tokenPair === HBD_HIVE_SWAP_POOL);
  const effectiveHiveUsd = hiveUsdFromHbdSwapPool(hbdPool, hiveUsd, hbdUsd);

  const results: Array<{ symbol: string; USD: number }> = [];

  for (const symbol of symbols) {
    if (symbol === 'SWAP.HIVE') {
      results.push({ symbol, USD: effectiveHiveUsd });
      continue;
    }

    const pairNeeded = ENGINE_POOL_PAIR_BY_SYMBOL[symbol];
    if (!pairNeeded) {
      continue;
    }

    const poolRow = pairLookup.get(pairNeeded);
    if (!poolRow) {
      continue;
    }

    const swapHiveLikeBaseToken = poolRow.tokenPair.split(':')[0] ?? '';
    const swapHiveLikeMatchesSymInput = swapHiveLikeBaseToken === symbol;

    const scaledUsdHiveCross = swapHiveLikeMatchesSymInput
      ? Number.parseFloat(poolRow.basePrice ?? '0') * effectiveHiveUsd
      : Number.parseFloat(poolRow.quotePrice ?? '0') * effectiveHiveUsd;

    if (!Number.isFinite(scaledUsdHiveCross) || scaledUsdHiveCross <= 0) {
      continue;
    }

    results.push({ symbol, USD: scaledUsdHiveCross });
  }

  return results;
}
