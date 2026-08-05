import {
  isEngineDisabledDepositL1Symbol,
  isEngineDisabledPeggedSwapSymbol,
} from '@opden-data-layer/core/hive-engine-history';

export type HiveEngineConverterPair = {
  from_coin_symbol: string;
  to_coin_symbol: string;
  pair?: string;
};

export type HiveEngineConverterCoin = {
  symbol: string;
  display_name: string;
};

export type DepositTokenListItem = {
  symbol: string;
  displayName: string;
  swapSymbol: string;
  pairLabel: string;
};

export function buildDepositTokenList(
  pairs: readonly HiveEngineConverterPair[],
  coins: readonly HiveEngineConverterCoin[],
): DepositTokenListItem[] {
  const coinBySymbol = new Map(
    coins.map((coin) => [coin.symbol.toUpperCase(), coin.display_name]),
  );
  const bySymbol = new Map<string, DepositTokenListItem>();

  for (const pair of pairs) {
    const symbol = pair.from_coin_symbol?.trim().toUpperCase();
    const swapSymbol = pair.to_coin_symbol?.trim().toUpperCase();
    if (!symbol || !swapSymbol) {
      continue;
    }
    if (symbol.startsWith('SWAP') || !swapSymbol.startsWith('SWAP')) {
      continue;
    }
    if (
      isEngineDisabledDepositL1Symbol(symbol) ||
      isEngineDisabledPeggedSwapSymbol(swapSymbol)
    ) {
      continue;
    }
    bySymbol.set(symbol, {
      symbol,
      displayName: coinBySymbol.get(symbol) ?? symbol,
      swapSymbol,
      pairLabel:
        typeof pair.pair === 'string' && pair.pair.length > 0
          ? pair.pair
          : `${symbol} -> ${swapSymbol}`,
    });
  }

  if (!bySymbol.has('HIVE')) {
    bySymbol.set('HIVE', {
      symbol: 'HIVE',
      displayName: coinBySymbol.get('HIVE') ?? 'HIVE',
      swapSymbol: 'SWAP.HIVE',
      pairLabel: 'HIVE -> SWAP.HIVE',
    });
  }

  return [...bySymbol.values()].sort((a, b) =>
    b.displayName.localeCompare(a.displayName),
  );
}

export function resolveDepositSwapSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  if (normalized.startsWith('SWAP.')) {
    return normalized;
  }
  return `SWAP.${normalized}`;
}
