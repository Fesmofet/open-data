'use client';

import { useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';

import {
  buildEnginePinnedTokenQuickActions,
  shouldShowEnginePinnedTokenQuickActions,
} from '../../../domain/engine-pinned-token-row-actions';
import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import { useWalletModal } from '../wallet/wallet-modal-context';
import { WalletSummaryHeader } from '../shared/wallet-summary-header';
import { EngineWalletBalanceRow } from './engine-wallet-balance-row';

export type EngineWalletSummaryProps = {
  summary: EngineWalletSummaryView;
  canManageWallet: boolean;
};

export function EngineWalletSummary({
  summary,
  canManageWallet,
}: EngineWalletSummaryProps) {
  const { t, locale } = useI18n();
  const { openModal } = useWalletModal();
  const combined = [...summary.pinnedTokens, ...summary.tokens];
  const estValue = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(summary.estimatedAccountValueUsd);

  const actionLabels = useMemo(
    () => ({
      swapTo: (symbol: string) =>
        interpolateMessage(t('wallet_swap_to'), { symbol }),
      swap: t('swap'),
      withdrawTo: (symbol: string) =>
        interpolateMessage(t('wallet_withdraw_to'), { symbol }),
    }),
    [t],
  );

  const openSwap = useMemo(
    () =>
      (state: { fromSymbol?: string; toSymbol?: string }) =>
        openModal({ kind: 'swap', ...state }),
    [openModal],
  );

  const openWithdraw = useMemo(
    () => (inputSymbol: string, outputSymbol: string) =>
      openModal({ kind: 'withdraw', inputSymbol, outputSymbol }),
    [openModal],
  );

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <WalletSummaryHeader
        tone="engine"
        title={t('hive_engine_tokens')}
        subtitle={t('hive_engine_tokens_info')}
        estAccountValueLabel={t('est_account_value')}
        estAccountValue={estValue}
      />
      <div className="divide-y divide-border p-card-padding">
        {combined.map((token) => {
          const showActions = shouldShowEnginePinnedTokenQuickActions(
            token,
            canManageWallet,
          );
          const actions = showActions
            ? buildEnginePinnedTokenQuickActions({
                symbol: token.symbol,
                labels: actionLabels,
                openSwap,
                openWithdraw,
              })
            : null;

          return (
            <EngineWalletBalanceRow
              key={token.symbol}
              token={token}
              actions={actions}
            />
          );
        })}
      </div>
    </section>
  );
}
