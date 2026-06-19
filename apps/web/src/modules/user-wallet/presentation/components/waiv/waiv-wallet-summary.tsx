'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  formatEngineTokenAmountDisplay,
  formatNextPowerDownSubtitle,
} from '../../../domain/engine-token-amount';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { useEngineTokenModal } from '../engine-token/engine-token-modal-context';
import {
  PersonIcon,
  PowerIcon,
  WaivTokenIcon,
  WaivWalletBalanceRow,
} from './waiv-wallet-balance-row';

export type WaivWalletSummaryProps = {
  summary: WaivWalletSummaryView;
  canManageWallet: boolean;
};

export function WaivWalletSummary({
  summary,
  canManageWallet,
}: WaivWalletSummaryProps) {
  const { t, locale } = useI18n();
  const { openModal } = useEngineTokenModal();
  const symbol = 'WAIV';
  const actions = canManageWallet
    ? {
        openPowerUp: () =>
          openModal({
            kind: 'power',
            mode: 'up',
            symbol,
            maxLiquid: summary.balance.liquid,
          }),
        openTransfer: () =>
          openModal({
            kind: 'transfer',
            symbol,
            maxLiquid: summary.balance.liquid,
            tokenUsdRate: summary.rates.waivUsd,
          }),
        openDelegate: () =>
          openModal({
            kind: 'delegate',
            symbol,
            maxStake: summary.balance.stake,
          }),
        openPowerDown: () =>
          openModal({
            kind: 'power',
            mode: 'down',
            symbol,
            maxStake: summary.balance.stake,
          }),
        openManage: () => openModal({ kind: 'manage', symbol }),
        openCancelPowerDown: () =>
          openModal({ kind: 'cancelPowerDown', symbol }),
      }
    : null;

  return (
    <section className="rounded-card border border-border bg-bg p-card-padding shadow-card">
      <WaivWalletBalanceRow
        icon={<WaivTokenIcon />}
        iconFullBleed
        title={t('waiv_token')}
        subtitle={t('liquid_waiv_tokens')}
        amount={summary.display.liquidWaiv}
        amountSuffix="WAIV"
        actions={
          actions
            ? {
                primaryLabel: t('power_up'),
                onPrimary: actions.openPowerUp,
                menuItems: [
                  {
                    id: 'transfer',
                    label: t('transfer'),
                    onSelect: actions.openTransfer,
                  },
                ],
              }
            : null
        }
      />
      <WaivWalletBalanceRow
        icon={<PowerIcon />}
        title={`${t('waiv_wallet')} Power`}
        subtitle={t('staked_waiv_tokens')}
        amount={summary.display.waivPower}
        amountSuffix="WP"
        showBorderBottom={
          !summary.flags.showPowerDownRow && !summary.flags.showDelegationsRow
        }
        actions={
          actions
            ? {
                primaryLabel: t('delegate'),
                onPrimary: actions.openDelegate,
                menuItems: [
                  {
                    id: 'power-down',
                    label: t('power_down'),
                    onSelect: actions.openPowerDown,
                  },
                ],
              }
            : null
        }
      />
      {summary.flags.showPowerDownRow ? (
        <WaivWalletBalanceRow
          reserveIconSpace
          title={t('power_down')}
          subtitle={formatNextPowerDownSubtitle(
            summary.powerDown?.nextUnstakeAt,
            locale,
            t('next_power_down'),
          )}
          amount={formatEngineTokenAmountDisplay(summary.balance.pendingUnstake)}
          amountSuffix="WP"
          showBorderBottom={!summary.flags.showDelegationsRow}
          actions={
            actions
              ? {
                  primaryLabel: t('cancel'),
                  onPrimary: actions.openCancelPowerDown,
                }
              : null
          }
        />
      ) : null}
      {summary.flags.showDelegationsRow ? (
        <WaivWalletBalanceRow
          reserveIconSpace
          title={`${t('waiv_wallet')} ${t('activity_delegation')}`}
          subtitle={t('manage_delegations')}
          amount={summary.display.delegationsNet}
          amountSuffix="WP"
          showBorderBottom={false}
          actions={
            actions
              ? {
                  primaryLabel: t('manage'),
                  onPrimary: actions.openManage,
                  menuItems: [
                    {
                      id: 'delegate',
                      label: t('delegate'),
                      onSelect: actions.openDelegate,
                    },
                  ],
                }
              : null
          }
        />
      ) : null}
      <div className="mt-2 flex items-center gap-4 border-t border-border pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <PersonIcon />
        </div>
        <p className="flex-1 text-body font-weight-strong text-fg">
          {t('est_account_value')}
        </p>
        <p className="text-body font-weight-strong text-fg tabular-nums">
          {summary.display.estAccountValueUsd} USD
        </p>
      </div>
    </section>
  );
}
