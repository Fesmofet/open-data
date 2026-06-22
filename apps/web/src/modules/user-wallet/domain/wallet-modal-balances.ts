import type { HiveWalletSummaryView } from './types/hive-wallet-view';
import type { WaivWalletSummaryView } from './types/waiv-wallet-view';
import type { WalletMainAsset, WalletTransferAsset } from './wallet-modal-types';
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

export function getWalletTransferBalanceConfig(
  asset: WalletTransferAsset,
  savings: 'none' | 'to' | 'from',
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
): WalletTransferBalanceConfig | null {
  if (asset === 'WAIV') {
    if (!waiv || savings !== 'none') {
      return null;
    }
    return {
      maxAmount: waiv.balance.liquid,
      tokenUsdRate: waiv.rates.waivUsd,
      validation: 'engine',
      symbol: 'WAIV',
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
): WalletPowerBalanceConfig | null {
  if (asset === 'WAIV') {
    if (!waiv) {
      return null;
    }
    return {
      maxAmount: mode === 'up' ? waiv.balance.liquid : waiv.balance.stake,
      balanceSymbol: mode === 'up' ? 'WAIV' : 'WP',
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
): WalletPowerBalanceConfig | null {
  if (asset === 'WAIV') {
    if (!waiv) {
      return null;
    }
    return {
      maxAmount: waiv.balance.stake,
      balanceSymbol: 'WAIV',
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

export function listWalletTransferAssetOptions(
  savings: 'none' | 'to' | 'from',
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
): WalletTransferAsset[] {
  if (savings === 'to' || savings === 'from') {
    return savings === 'from' ? ['HIVE', 'HBD'] : ['HIVE', 'HBD'];
  }

  const options: WalletTransferAsset[] = [];
  if (waiv) {
    options.push('WAIV');
  }
  if (hive) {
    options.push('HIVE', 'HBD');
  }
  return options;
}

export function listWalletMainAssetOptions(
  waiv: WaivWalletSummaryView | null,
  hive: HiveWalletSummaryView | null,
): WalletMainAsset[] {
  const options: WalletMainAsset[] = [];
  if (waiv) {
    options.push('WAIV');
  }
  if (hive) {
    options.push('HIVE');
  }
  return options;
}

function parseRcInteger(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

/** Max RC for delegate_rc: delegatable max_rc capped by current mana (must have RC to broadcast). */
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
