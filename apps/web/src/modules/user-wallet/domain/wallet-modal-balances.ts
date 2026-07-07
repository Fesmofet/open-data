import type { EngineWalletSummaryView } from './types/engine-wallet-view';
import type { HiveWalletSummaryView } from './types/hive-wallet-view';
import type { WaivWalletSummaryView } from './types/waiv-wallet-view';
import {
  isEngineTokenAsset,
  type WalletMainAsset,
  type WalletTransferAsset,
} from './wallet-modal-types';
import { HIVE_RC_DELEGATOR_RESERVE } from '../constants/hive-rc';

export type WalletAmountValidation = 'engine' | 'hive';

export type WalletTransferBalanceConfig = {
  maxAmount: string;
  tokenUsdRate: number;
  validation: WalletAmountValidation;
  symbol: WalletTransferAsset;
};

export type WalletPowerBalanceConfig = {
  maxAmount: string;
  balanceSymbol: string;
  validation: WalletAmountValidation;
};

function findEngineTokenRow(
  engineSummary: EngineWalletSummaryView | null | undefined,
  symbol: string,
) {
  if (!engineSummary) {
    return null;
  }
  return (
    [...engineSummary.pinnedTokens, ...engineSummary.tokens].find(
      (row) => row.symbol === symbol,
    ) ?? null
  );
}

export function getWalletTransferBalanceConfig(
  asset: WalletTransferAsset,
  savings: 'none' | 'to' | 'from',
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
  engineSummary?: EngineWalletSummaryView | null,
): WalletTransferBalanceConfig | null {
  if (isEngineTokenAsset(asset)) {
    if (savings !== 'none') {
      return null;
    }
    if (asset === 'WAIV' && waiv) {
      return {
        maxAmount: waiv.balance.liquid,
        tokenUsdRate: waiv.rates.waivUsd,
        validation: 'engine',
        symbol: asset,
      };
    }
    const row = findEngineTokenRow(engineSummary, asset);
    if (!row) {
      return null;
    }
    return {
      maxAmount: row.balance,
      tokenUsdRate: row.usdEstimate,
      validation: 'engine',
      symbol: asset,
    };
  }

  if (!hive) {
    return null;
  }

  if (asset === 'HIVE') {
    if (savings === 'from') {
      return {
        maxAmount: hive.balance.hiveSavings,
        tokenUsdRate: hive.rates.hiveUsd,
        validation: 'hive',
        symbol: 'HIVE',
      };
    }
    return {
      maxAmount: hive.balance.liquidHive,
      tokenUsdRate: hive.rates.hiveUsd,
      validation: 'hive',
      symbol: 'HIVE',
    };
  }

  if (savings === 'from') {
    return {
      maxAmount: hive.balance.hbdSavings,
      tokenUsdRate: hive.rates.hbdUsd,
      validation: 'hive',
      symbol: 'HBD',
    };
  }

  return {
    maxAmount: hive.balance.hbdLiquid,
    tokenUsdRate: hive.rates.hbdUsd,
    validation: 'hive',
    symbol: 'HBD',
  };
}

export function getWalletPowerBalanceConfig(
  asset: WalletMainAsset,
  mode: 'up' | 'down',
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
  engineSummary?: EngineWalletSummaryView | null,
): WalletPowerBalanceConfig | null {
  if (isEngineTokenAsset(asset)) {
    if (asset === 'WAIV' && waiv) {
      return {
        maxAmount: mode === 'up' ? waiv.balance.liquid : waiv.balance.stake,
        balanceSymbol: mode === 'up' ? 'WAIV' : 'WP',
        validation: 'engine',
      };
    }
    const row = findEngineTokenRow(engineSummary, asset);
    if (!row || !row.stakingEnabled) {
      return null;
    }
    return {
      maxAmount: mode === 'up' ? row.balance : row.stake,
      balanceSymbol: asset,
      validation: 'engine',
    };
  }

  if (!hive) {
    return null;
  }

  return {
    maxAmount: mode === 'up' ? hive.balance.liquidHive : hive.balance.hivePower,
    balanceSymbol: mode === 'up' ? 'HIVE' : 'HP',
    validation: 'hive',
  };
}

export function getWalletDelegateBalanceConfig(
  asset: WalletMainAsset,
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
  engineSummary?: EngineWalletSummaryView | null,
): WalletPowerBalanceConfig | null {
  if (isEngineTokenAsset(asset)) {
    if (asset === 'WAIV' && waiv) {
      return {
        maxAmount: waiv.balance.stake,
        balanceSymbol: 'WAIV',
        validation: 'engine',
      };
    }
    const row = findEngineTokenRow(engineSummary, asset);
    if (!row) {
      return null;
    }
    return {
      maxAmount: row.stake,
      balanceSymbol: asset,
      validation: 'engine',
    };
  }

  if (!hive) {
    return null;
  }

  return {
    maxAmount: hive.balance.hivePower,
    balanceSymbol: 'HP',
    validation: 'hive',
  };
}

function listEngineTransferAssets(
  engineSummary: EngineWalletSummaryView | null | undefined,
): WalletTransferAsset[] {
  if (!engineSummary) {
    return [];
  }
  return [...engineSummary.pinnedTokens, ...engineSummary.tokens]
    .filter((row) => Number.parseFloat(row.balance) > 0)
    .map((row) => row.symbol);
}

function listEnginePowerAssets(
  engineSummary: EngineWalletSummaryView | null | undefined,
): WalletMainAsset[] {
  if (!engineSummary) {
    return [];
  }
  return [...engineSummary.pinnedTokens, ...engineSummary.tokens]
    .filter((row) => row.stakingEnabled)
    .filter(
      (row) =>
        Number.parseFloat(row.balance) > 0 || Number.parseFloat(row.stake) > 0,
    )
    .map((row) => row.symbol);
}

export function listWalletTransferAssetOptions(
  savings: 'none' | 'to' | 'from',
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
  engineSummary?: EngineWalletSummaryView | null,
): WalletTransferAsset[] {
  if (savings === 'to' || savings === 'from') {
    return ['HIVE', 'HBD'];
  }

  const options: WalletTransferAsset[] = [];
  const engineAssets = listEngineTransferAssets(engineSummary);
  for (const symbol of engineAssets) {
    if (!options.includes(symbol)) {
      options.push(symbol);
    }
  }
  if (waiv && !options.includes('WAIV')) {
    options.unshift('WAIV');
  }
  if (hive) {
    if (!options.includes('HIVE')) {
      options.push('HIVE');
    }
    if (!options.includes('HBD')) {
      options.push('HBD');
    }
  }
  return options;
}

export function listWalletMainAssetOptions(
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
  engineSummary?: EngineWalletSummaryView | null,
): WalletMainAsset[] {
  const options: WalletMainAsset[] = [];
  for (const symbol of listEnginePowerAssets(engineSummary)) {
    if (!options.includes(symbol)) {
      options.push(symbol);
    }
  }
  if (waiv && !options.includes('WAIV')) {
    options.unshift('WAIV');
  }
  if (hive && !options.includes('HIVE')) {
    options.push('HIVE');
  }
  return options;
}

function parseRcInteger(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export function getHiveDelegateRcMaxAmount(
  hive: HiveWalletSummaryView | null,
): string {
  if (!hive?.rc) {
    return '0';
  }
  const maxCapacity = parseRcInteger(hive.rc.maxCapacity);
  const delegated = parseRcInteger(hive.rc.delegatedRc);
  const currentMana = parseRcInteger(hive.rc.currentMana);
  const delegatable = Math.max(0, maxCapacity - delegated);
  const capped =
    currentMana > 0 ? Math.min(delegatable, currentMana) : delegatable;
  const max = Math.max(0, capped - HIVE_RC_DELEGATOR_RESERVE);
  return max > 0 ? String(max) : '0';
}
