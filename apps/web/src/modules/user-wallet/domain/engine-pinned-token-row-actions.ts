import {
  isEngineDisabledPeggedSwapSymbol,
  isEngineDisabledWithdrawL1Symbol,
} from '@opden-data-layer/core/hive-engine-history';

import { parseEngineTokenAmount } from './engine-token-amount';
import type { EngineTokenBalanceRowView } from './types/engine-wallet-view';
import type { WalletSwapModalState } from './wallet-modal-types';

const SWAP_TO_WAIV_SYMBOL = 'WAIV';

export type EnginePinnedTokenQuickActionLabels = {
  swapTo: (symbol: string) => string;
  swap: string;
  withdrawTo: (symbol: string) => string;
};

export type EnginePinnedTokenQuickActions = {
  primaryLabel: string;
  onPrimary: () => void;
  menuItems: Array<{
    id: string;
    label: string;
    onSelect: () => void;
  }>;
};

export function peggedSwapWithdrawL1Symbol(symbol: string): string | null {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized.startsWith('SWAP.')) {
    return null;
  }
  if (isEngineDisabledPeggedSwapSymbol(normalized)) {
    return null;
  }
  const l1 = normalized.slice('SWAP.'.length);
  if (!l1 || isEngineDisabledWithdrawL1Symbol(l1)) {
    return null;
  }
  return l1;
}

export function shouldShowEnginePinnedTokenQuickActions(
  token: Pick<EngineTokenBalanceRowView, 'isPinned' | 'symbol' | 'balance'>,
  canManage: boolean,
): boolean {
  if (!canManage || !token.isPinned) {
    return false;
  }
  if (isEngineDisabledPeggedSwapSymbol(token.symbol)) {
    return false;
  }
  return parseEngineTokenAmount(token.balance) !== null;
}

export function buildEnginePinnedTokenQuickActions(params: {
  symbol: string;
  labels: EnginePinnedTokenQuickActionLabels;
  openSwap: (state: Pick<WalletSwapModalState, 'fromSymbol' | 'toSymbol'>) => void;
  openWithdraw: (inputSymbol: string, outputSymbol: string) => void;
}): EnginePinnedTokenQuickActions | null {
  const symbol = params.symbol.trim().toUpperCase();
  const l1 = peggedSwapWithdrawL1Symbol(symbol);
  if (!l1) {
    return null;
  }

  const menuItems: EnginePinnedTokenQuickActions['menuItems'] = [
    {
      id: 'swap',
      label: params.labels.swap,
      onSelect: () => params.openSwap({ fromSymbol: symbol }),
    },
    {
      id: 'withdraw',
      label: params.labels.withdrawTo(l1),
      onSelect: () => params.openWithdraw(symbol, l1),
    },
  ];

  return {
    primaryLabel: params.labels.swapTo(SWAP_TO_WAIV_SYMBOL),
    onPrimary: () =>
      params.openSwap({ fromSymbol: symbol, toSymbol: SWAP_TO_WAIV_SYMBOL }),
    menuItems,
  };
}
