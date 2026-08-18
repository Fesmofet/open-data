import type {
  HiveEngineMarketMetric,
  HiveEngineToken,
  HiveEngineTokenBalance,
} from '@opden-data-layer/clients';
import {
  ENGINE_PINNED_SWAP_SYMBOLS,
  ENGINE_WALLET_EXCLUDED_SYMBOLS,
  ENGINE_WALLET_MIN_DISPLAY_BALANCE,
  isEngineDisabledPeggedSwapSymbol,
  type EnginePinnedSwapSymbol,
} from '@opden-data-layer/core/hive-engine-history';

import type { EngineTokenBalanceRow } from './schemas/engine-wallet.schema';

const ZERO = '0';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function parseTokenIconUrl(metadata: string): string | null {
  if (!metadata.trim()) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(metadata);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const icon = (parsed as { icon?: unknown }).icon;
    return typeof icon === 'string' && icon.trim() ? icon.trim() : null;
  } catch {
    return null;
  }
}

function tokenInfoBySymbol(
  tokens: readonly HiveEngineToken[],
): Map<string, HiveEngineToken> {
  return new Map(tokens.map((token) => [token.symbol, token]));
}

function balanceBySymbol(
  balances: readonly HiveEngineTokenBalance[],
): Map<string, HiveEngineTokenBalance> {
  return new Map(balances.map((row) => [row.symbol, row]));
}

function emptyBalance(symbol: string): HiveEngineTokenBalance {
  return {
    _id: 0,
    account: '',
    symbol,
    balance: ZERO,
    stake: ZERO,
    pendingUnstake: ZERO,
    delegationsIn: ZERO,
    delegationsOut: ZERO,
    pendingUndelegations: ZERO,
  };
}

function shouldShowTokenRow(
  symbol: string,
  balance: HiveEngineTokenBalance,
): boolean {
  if (isEngineDisabledPeggedSwapSymbol(symbol)) {
    return false;
  }
  if (symbol.includes('SWAP')) {
    return true;
  }
  const liquid = parseAmount(balance.balance);
  const stake = parseAmount(balance.stake);
  return liquid >= ENGINE_WALLET_MIN_DISPLAY_BALANCE ||
    stake >= ENGINE_WALLET_MIN_DISPLAY_BALANCE;
}

function usdForPinnedSymbol(
  symbol: EnginePinnedSwapSymbol,
  balance: HiveEngineTokenBalance,
  swapUsdBySymbol: ReadonlyMap<string, number>,
): number {
  const rate = swapUsdBySymbol.get(symbol) ?? 0;
  const total =
    parseAmount(balance.balance) + parseAmount(balance.stake);
  return total * rate;
}

function usdForOtherSymbol(
  balance: HiveEngineTokenBalance,
  metric: HiveEngineMarketMetric | undefined,
  hiveUsd: number,
): number {
  const lastPrice = metric ? parseAmount(metric.lastPrice) : 0;
  const total =
    parseAmount(balance.balance) + parseAmount(balance.stake);
  return total * lastPrice * hiveUsd;
}

function buildTokenRow(params: {
  symbol: string;
  balance: HiveEngineTokenBalance;
  token: HiveEngineToken | undefined;
  usdEstimate: number;
  isPinned: boolean;
}): EngineTokenBalanceRow {
  return {
    symbol: params.symbol,
    name: params.token?.name ?? params.symbol,
    iconUrl: params.token ? parseTokenIconUrl(params.token.metadata) : null,
    balance: params.balance.balance,
    stake: params.balance.stake,
    stakingEnabled: params.token?.stakingEnabled ?? false,
    precision: params.token?.precision ?? 3,
    usdEstimate: params.usdEstimate,
    isPinned: params.isPinned,
    unstakingCooldown: Number(params.token?.unstakingCooldown ?? 0),
    numberTransactions: Number(params.token?.numberTransactions ?? 0),
  };
}

function isPinnedSwapSymbol(symbol: string): symbol is EnginePinnedSwapSymbol {
  return (ENGINE_PINNED_SWAP_SYMBOLS as readonly string[]).includes(symbol);
}

export function listPowerEligibleEngineRows(params: {
  accountBalances: readonly HiveEngineTokenBalance[];
  tokenMetadata: readonly HiveEngineToken[];
  swapUsdBySymbol: ReadonlyMap<string, number>;
  marketMetrics: readonly HiveEngineMarketMetric[];
  hiveUsd: number;
}): EngineTokenBalanceRow[] {
  const tokens = tokenInfoBySymbol(params.tokenMetadata);
  const metrics = new Map(
    params.marketMetrics.map((row) => [row.symbol, row]),
  );
  const excluded = new Set<string>(ENGINE_WALLET_EXCLUDED_SYMBOLS);
  const seen = new Set<string>();
  const rows: EngineTokenBalanceRow[] = [];

  const tryAdd = (symbol: string, balance: HiveEngineTokenBalance) => {
    if (excluded.has(symbol)) {
      return;
    }
    if (seen.has(symbol)) {
      return;
    }
    const token = tokens.get(symbol);
    if (!token?.stakingEnabled) {
      return;
    }
    if (
      parseAmount(balance.balance) <= 0 &&
      parseAmount(balance.stake) <= 0
    ) {
      return;
    }
    seen.add(symbol);
    const isPinned = isPinnedSwapSymbol(symbol);
    const usdEstimate = isPinned
      ? usdForPinnedSymbol(symbol, balance, params.swapUsdBySymbol)
      : usdForOtherSymbol(balance, metrics.get(symbol), params.hiveUsd);
    rows.push(
      buildTokenRow({
        symbol,
        balance,
        token,
        usdEstimate,
        isPinned,
      }),
    );
  };

  for (const balance of params.accountBalances) {
    tryAdd(balance.symbol, balance);
  }

  rows.sort((a, b) => {
    const totalA = parseAmount(a.balance) + parseAmount(a.stake);
    const totalB = parseAmount(b.balance) + parseAmount(b.stake);
    return totalB - totalA || a.symbol.localeCompare(b.symbol);
  });

  return rows;
}

export function buildEngineWalletSummary(params: {
  accountBalances: readonly HiveEngineTokenBalance[];
  tokenMetadata: readonly HiveEngineToken[];
  swapUsdBySymbol: ReadonlyMap<string, number>;
  marketMetrics: readonly HiveEngineMarketMetric[];
  hiveUsd: number;
}): {
  pinnedTokens: EngineTokenBalanceRow[];
  tokens: EngineTokenBalanceRow[];
  powerEligibleTokens: EngineTokenBalanceRow[];
  estimatedAccountValueUsd: number;
} {
  const balances = balanceBySymbol(params.accountBalances);
  const tokens = tokenInfoBySymbol(params.tokenMetadata);
  const metrics = new Map(
    params.marketMetrics.map((row) => [row.symbol, row]),
  );

  const pinnedTokens = ENGINE_PINNED_SWAP_SYMBOLS.map((symbol) => {
    const balance = balances.get(symbol) ?? emptyBalance(symbol);
    const usdEstimate = usdForPinnedSymbol(
      symbol,
      balance,
      params.swapUsdBySymbol,
    );
    return buildTokenRow({
      symbol,
      balance,
      token: tokens.get(symbol),
      usdEstimate,
      isPinned: true,
    });
  });

  const excluded = new Set<string>(ENGINE_WALLET_EXCLUDED_SYMBOLS);
  const otherRows: EngineTokenBalanceRow[] = [];

  for (const balance of params.accountBalances) {
    if (excluded.has(balance.symbol)) {
      continue;
    }
    if (!shouldShowTokenRow(balance.symbol, balance)) {
      continue;
    }
    const usdEstimate = usdForOtherSymbol(
      balance,
      metrics.get(balance.symbol),
      params.hiveUsd,
    );
    otherRows.push(
      buildTokenRow({
        symbol: balance.symbol,
        balance,
        token: tokens.get(balance.symbol),
        usdEstimate,
        isPinned: false,
      }),
    );
  }

  otherRows.sort(
    (a, b) => parseAmount(b.balance) - parseAmount(a.balance),
  );

  const estimatedAccountValueUsd = [...pinnedTokens, ...otherRows].reduce(
    (sum, row) => sum + row.usdEstimate,
    0,
  );

  const powerEligibleTokens = listPowerEligibleEngineRows({
    accountBalances: params.accountBalances,
    tokenMetadata: params.tokenMetadata,
    swapUsdBySymbol: params.swapUsdBySymbol,
    marketMetrics: params.marketMetrics,
    hiveUsd: params.hiveUsd,
  });

  return {
    pinnedTokens,
    tokens: otherRows,
    powerEligibleTokens,
    estimatedAccountValueUsd,
  };
}
