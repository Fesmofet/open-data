'use client';

import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';

import {
  formatEngineTokenAmountDisplay,
  formatNextPowerDownAt,
  formatNextPowerDownSubtitle,
} from '../../../domain/engine-token-amount';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import type { WalletMainAsset } from '../../../domain/wallet-modal-types';
import { WAIV_WITHDRAW_OUTPUT_SYMBOLS } from '../../../domain/waiv-withdraw-outputs';
import { useWalletModal } from '../wallet/wallet-modal-context';
import { WalletDelegationsListModal } from '../wallet/wallet-delegations-list-modal';
import { WalletPowerDownProgressModal } from '../wallet/wallet-power-down-progress-modal';
import {
  PersonIcon,
  PowerIcon,
  WaivTokenIcon,
  WaivWalletBalanceRow,
} from './waiv-wallet-balance-row';

export type WaivWalletSummaryProps = {
  summary: WaivWalletSummaryView;
  canManageWallet: boolean;
  defaultAsset: WalletMainAsset;
  hideRowActions?: boolean;
};

export function WaivWalletSummary({
  summary,
  canManageWallet,
  defaultAsset,
  hideRowActions = false,
}: WaivWalletSummaryProps) {
  const { t, locale } = useI18n();
  const { openModal } = useWalletModal();
  const [powerDownProgressOpen, setPowerDownProgressOpen] = useState(false);
  const [waivDelegationsOpen, setWaivDelegationsOpen] = useState(false);

  const powerDownTooltipDate = formatNextPowerDownAt(
    summary.powerDown?.nextUnstakeAt,
    locale,
  );
  const powerDownTooltip = useMemo(() => {
    if (!powerDownTooltipDate) {
      return t('wallet_wp_delegations_tooltip');
    }
    return interpolateMessage(t('wallet_pending_power_down_tooltip'), {
      date: powerDownTooltipDate,
    });
  }, [powerDownTooltipDate, t]);

  const actions = canManageWallet && !hideRowActions
    ? {
        openPowerUp: () =>
          openModal({ kind: 'power', mode: 'up', asset: defaultAsset }),
        openTransfer: () =>
          openModal({ kind: 'transfer', asset: defaultAsset }),
        openWithdraw: (outputSymbol: string) =>
          openModal({
            kind: 'withdraw',
            inputSymbol: 'WAIV',
            outputSymbol,
          }),
        openDelegate: () =>
          openModal({ kind: 'delegate', asset: defaultAsset }),
        openPowerDown: () =>
          openModal({ kind: 'power', mode: 'down', asset: defaultAsset }),
        openManage: () => openModal({ kind: 'manage', asset: defaultAsset }),
        openCancelPowerDown: () =>
          openModal({ kind: 'cancelPowerDown', asset: defaultAsset }),
      }
    : null;

  const waivTokenMenuItems = actions
    ? [
        {
          id: 'transfer',
          label: t('transfer'),
          onSelect: actions.openTransfer,
        },
        ...WAIV_WITHDRAW_OUTPUT_SYMBOLS.map((outputSymbol) => ({
          id: `withdraw-${outputSymbol}`,
          label: interpolateMessage(t('wallet_withdraw_to'), { symbol: outputSymbol }),
          onSelect: () => actions.openWithdraw(outputSymbol),
        })),
      ]
    : [];

  return (
    <section className="rounded-card border border-border bg-surface p-card-padding shadow-card">
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
                menuItems: waivTokenMenuItems,
              }
            : null
        }
      />
      <WaivWalletBalanceRow
        icon={<PowerIcon />}
        iconVariant="accent"
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
          amountOnClick={() => setPowerDownProgressOpen(true)}
          amountTooltip={powerDownTooltip}
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
          amountOnClick={() => setWaivDelegationsOpen(true)}
          amountTooltip={t('wallet_wp_delegations_tooltip')}
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
      {summary.flags.showPowerDownRow ? (
        <WalletPowerDownProgressModal
          open={powerDownProgressOpen}
          onClose={() => setPowerDownProgressOpen(false)}
          title={t('power_down')}
          amount={formatEngineTokenAmountDisplay(summary.balance.pendingUnstake)}
          symbol="WP"
          nextDateLabel={powerDownTooltipDate}
          weeksTotal={4}
        />
      ) : null}
      <WalletDelegationsListModal
        open={waivDelegationsOpen}
        onClose={() => setWaivDelegationsOpen(false)}
        account={summary.account}
        variant="waiv"
      />
    </section>
  );
}
