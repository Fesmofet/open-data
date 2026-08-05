import type { HiveEngineMarketPool, HiveEngineTokenBalance } from '@opden-data-layer/clients';
import { isEngineDisabledPeggedSwapSymbol } from '@opden-data-layer/core/hive-engine-history';

export type SwapListPair = {
  symbol: string;
  tokenPair: string;
  precision: number;
};

export type SwapListToken = {
  symbol: string;
  name: string;
  balance: string;
  precision: number;
  iconUrl: string | null;
  pairs: SwapListPair[];
};

function parseTokenIcon(metadata: string | undefined): string | null {
  if (!metadata) {
    return null;
  }
  try {
    const parsed = JSON.parse(metadata) as { icon?: unknown };
    return typeof parsed.icon === 'string' && parsed.icon.length > 0
      ? parsed.icon
      : null;
  } catch {
    return null;
  }
}

export function buildSwapAdjacency(
  pools: readonly HiveEngineMarketPool[],
): Map<string, SwapListPair[]> {
  const adjacency = new Map<string, SwapListPair[]>();

  for (const pool of pools) {
    const [baseSymbol, quoteSymbol] = pool.tokenPair.split(':');
    if (!baseSymbol || !quoteSymbol) {
      continue;
    }

    const basePairs = adjacency.get(baseSymbol) ?? [];
    basePairs.push({
      symbol: quoteSymbol,
      tokenPair: pool.tokenPair,
      precision: pool.precision,
    });
    adjacency.set(baseSymbol, basePairs);

    const quotePairs = adjacency.get(quoteSymbol) ?? [];
    quotePairs.push({
      symbol: baseSymbol,
      tokenPair: pool.tokenPair,
      precision: pool.precision,
    });
    adjacency.set(quoteSymbol, quotePairs);
  }

  return adjacency;
}

export function buildSwapListTokens(input: {
  pools: readonly HiveEngineMarketPool[];
  balances: readonly HiveEngineTokenBalance[];
  tokenMetadata: ReadonlyMap<string, { name: string; precision: number; metadata: string }>;
}): SwapListToken[] {
  const adjacency = buildSwapAdjacency(input.pools);
  const balanceBySymbol = new Map(
    input.balances.map((row) => [row.symbol, row.balance]),
  );

  const symbols = new Set<string>();
  for (const row of input.balances) {
    if (Number.parseFloat(row.balance) > 0) {
      symbols.add(row.symbol);
    }
  }

  const tokens: SwapListToken[] = [];
  for (const symbol of symbols) {
    if (isEngineDisabledPeggedSwapSymbol(symbol)) {
      continue;
    }
    const rawPairs = adjacency.get(symbol);
    if (!rawPairs || rawPairs.length === 0) {
      continue;
    }
    const pairs = rawPairs.filter(
      (pair) => !isEngineDisabledPeggedSwapSymbol(pair.symbol),
    );
    if (pairs.length === 0) {
      continue;
    }
    const meta = input.tokenMetadata.get(symbol);
    tokens.push({
      symbol,
      name: meta?.name ?? symbol,
      balance: balanceBySymbol.get(symbol) ?? '0',
      precision: meta?.precision ?? 8,
      iconUrl: parseTokenIcon(meta?.metadata),
      pairs,
    });
  }

  tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
  return tokens;
}

export function findSwapPair(
  tokens: readonly SwapListToken[],
  fromSymbol: string,
  toSymbol: string,
): SwapListPair | null {
  const fromToken = tokens.find((token) => token.symbol === fromSymbol);
  if (!fromToken) {
    return null;
  }
  return fromToken.pairs.find((pair) => pair.symbol === toSymbol) ?? null;
}
