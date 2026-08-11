'use client';

import { useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';

import { buildClaimHbdInterestOps } from '@opden-data-layer/hive-broadcast';

import {
  formatHiveNextPowerDownDate,
  formatHiveNextPowerDownSubtitle,
} from '../../../domain/hive-wallet-amount';
import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WalletMainAsset } from '../../../domain/wallet-modal-types';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { useWalletModal } from '../wallet/wallet-modal-context';
import { WalletDelegationsListModal } from '../wallet/wallet-delegations-list-modal';
import { WalletPowerDownProgressModal } from '../wallet/wallet-power-down-progress-modal';
import { WalletRcDetailsModal } from '../wallet/wallet-rc-details-modal';
import { WalletSavingsWithdrawProgressModal } from '../wallet/wallet-savings-withdraw-progress-modal';
import { WalletSummaryHeader } from '../shared/wallet-summary-header';
import {
  HbdSavingsShieldIcon,
  HbdTokenIcon,
  HivePowerIcon,
  HiveSavingsShieldIcon,
  HiveTokenIcon,
  HiveWalletBalanceRow,
} from './hive-wallet-balance-row';

export type HiveWalletSummaryProps = {
  summary: HiveWalletSummaryView;
  canManageWallet: boolean;
  accountName: string;
  defaultAsset: WalletMainAsset;
};

type SavingsProgressState = {
  amount: string;
  asset: 'HIVE' | 'HBD';
  daysRemaining?: number | null;
};

export function HiveWalletSummary({
  summary,
  canManageWallet,
  accountName,
  defaultAsset,
}: HiveWalletSummaryProps) {
  const { t, locale } = useI18n();
  const { openModal } = useWalletModal();
  const { broadcast, pending: claimPending } = useHiveBroadcast(accountName);
  const [rcDetailsOpen, setRcDetailsOpen] = useState(false);
  const [powerDownProgressOpen, setPowerDownProgressOpen] = useState(false);
  const [hpDelegationsOpen, setHpDelegationsOpen] = useState(false);
  const [rcDelegationsOpen, setRcDelegationsOpen] = useState(false);
  const [savingsProgress, setSavingsProgress] = useState<SavingsProgressState | null>(
    null,
  );

  const powerDownTooltipDate = formatHiveNextPowerDownDate(
    summary.powerDown?.nextVestingWithdrawal,
    locale,
  );
  const powerDownTooltip = useMemo(() => {
    if (!powerDownTooltipDate) {
      return undefined;
    }
    return interpolateMessage(t('wallet_pending_power_down_tooltip'), {
      date: powerDownTooltipDate,
    });
  }, [powerDownTooltipDate, t]);
  const powerDownNextLabel = powerDownTooltipDate;
  const claimDisabledTooltip =
    summary.interest?.canClaim === true || summary.interest?.daysUntilClaim === undefined
      ? undefined
      : interpolateMessage(t('wallet_interest_claim_in_days'), {
          days: String(summary.interest.daysUntilClaim),
        });

  const actions = canManageWallet
    ? {
        openPowerUp: () =>
          openModal({ kind: 'power', mode: 'up', asset: defaultAsset }),
        openTransferHive: () =>
          openModal({ kind: 'transfer', asset: 'HIVE' }),
        openTransferHiveToSavings: () =>
          openModal({ kind: 'transfer', asset: 'HIVE', toSavings: true }),
        openDelegate: () =>
          openModal({ kind: 'delegate', asset: defaultAsset }),
        openPowerDown: () =>
          openModal({ kind: 'power', mode: 'down', asset: defaultAsset }),
        openManageHp: () => openModal({ kind: 'manage', asset: defaultAsset }),
        openDelegateRc: () => openModal({ kind: 'delegateRc' }),
        openDepositHiveSavings: () =>
          openModal({ kind: 'transfer', asset: 'HIVE', toSavings: true }),
        openWithdrawHiveSavings: () =>
          openModal({ kind: 'transfer', asset: 'HIVE', fromSavings: true }),
        openTransferHbd: () =>
          openModal({ kind: 'transfer', asset: 'HBD' }),
        openTransferHbdToSavings: () =>
          openModal({ kind: 'transfer', asset: 'HBD', toSavings: true }),
        openWithdrawHbdSavings: () =>
          openModal({ kind: 'transfer', asset: 'HBD', fromSavings: true }),
        openDepositHbdSavings: () =>
          openModal({ kind: 'transfer', asset: 'HBD', toSavings: true }),
        openCancelPowerDown: () =>
          openModal({ kind: 'cancelPowerDown', asset: defaultAsset }),
        openClaimInterest: async () => {
          await broadcast(buildClaimHbdInterestOps(accountName));
        },
      }
    : null;

  const hivePending = summary.pendingSavingsWithdrawals.filter(
    (row) => row.asset === 'HIVE',
  );
  const hbdPending = summary.pendingSavingsWithdrawals.filter(
    (row) => row.asset === 'HBD',
  );

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <WalletSummaryHeader
        tone="hive"
        title={t('hive_tokens')}
        subtitle={t('hive_tokens_info')}
        estAccountValueLabel={t('est_account_value')}
        estAccountValue={`${summary.display.estAccountValueUsd} USD`}
      />
      <div className="p-card-padding">
      <HiveWalletBalanceRow
        icon={<HiveTokenIcon />}
        iconFullBleed
        title={t('hive_token')}
        subtitle={t('liquid_hive_tokens')}
        amount={summary.display.liquidHive}
        amountSuffix="HIVE"
        actions={
          actions
            ? {
                primaryLabel: t('power_up'),
                onPrimary: actions.openPowerUp,
                menuItems: [
                  {
                    id: 'transfer',
                    label: t('transfer'),
                    onSelect: actions.openTransferHive,
                  },
                  {
                    id: 'to-savings',
                    label: t('transfer_to_savings_title'),
                    onSelect: actions.openTransferHiveToSavings,
                  },
                ],
              }
            : null
        }
      />
      <HiveWalletBalanceRow
        icon={<HivePowerIcon />}
        iconVariant="red"
        title={t('wallet_hive_power')}
        subtitle={t('staked_hive_tokens')}
        amount={summary.display.hivePower}
        amountSuffix="HP"
        showBorderBottom={false}
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
        <HiveWalletBalanceRow
          reserveIconSpace
          title={t('power_down')}
          subtitle={formatHiveNextPowerDownSubtitle(
            summary.powerDown?.nextVestingWithdrawal,
            locale,
            t('next_power_down'),
          )}
          amount={summary.powerDown?.vestingWithdrawRateHp ?? '0'}
          amountSuffix="HP"
          amountOnClick={() => setPowerDownProgressOpen(true)}
          amountTooltip={powerDownTooltip}
          showBorderBottom={false}
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
        <HiveWalletBalanceRow
          reserveIconSpace
          title={t('wallet_hive_delegations')}
          subtitle={t('wallet_hive_delegations_info')}
          amount={summary.display.delegationsNetHp}
          amountSuffix="HP"
          amountOnClick={() => setHpDelegationsOpen(true)}
          amountTooltip={t('wallet_hp_delegations_tooltip')}
          showBorderBottom={false}
          actions={
            actions
              ? {
                  primaryLabel: t('manage'),
                  onPrimary: actions.openManageHp,
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
      <HiveWalletBalanceRow
        reserveIconSpace
        title={t('resource_credits')}
        subtitle={t('wallet_resource_credits_info')}
        amount={summary.display.rcMax}
        amountSuffix="b RC"
        amountOnClick={summary.rc ? () => setRcDetailsOpen(true) : undefined}
        actions={
          actions
            ? {
                primaryLabel: t('delegate_rc'),
                onPrimary: actions.openDelegateRc,
              }
            : null
        }
      />
      {summary.flags.showRcDelegationsRow ? (
        <HiveWalletBalanceRow
          reserveIconSpace
          title={t('wallet_rc_delegations')}
          subtitle={t('wallet_rc_delegations_info')}
          amount={summary.display.rcDelegationsNet ?? '0'}
          amountSuffix="b RC"
          amountOnClick={() => setRcDelegationsOpen(true)}
          actions={
            actions
              ? {
                  primaryLabel: t('manage'),
                  onPrimary: () => openModal({ kind: 'manageRc' }),
                  menuItems: [
                    {
                      id: 'delegate-rc',
                      label: t('delegate_rc'),
                      onSelect: actions.openDelegateRc,
                    },
                  ],
                }
              : null
          }
        />
      ) : null}
      <HiveWalletBalanceRow
        icon={<HiveSavingsShieldIcon />}
        iconVariant="plain"
        title={t('wallet_hive_savings')}
        subtitle={t('wallet_hive_savings_period')}
        amount={summary.display.hiveSavings}
        amountSuffix="HIVE"
        actions={
          actions
            ? {
                primaryLabel: t('deposit'),
                onPrimary: actions.openDepositHiveSavings,
                menuItems: [
                  {
                    id: 'from-savings',
                    label: t('transfer_from_savings_title'),
                    onSelect: actions.openWithdrawHiveSavings,
                  },
                ],
              }
            : null
        }
      />
      {hivePending.map((row) => (
        <HiveWalletBalanceRow
          key={`hive-pending-${row.requestId}`}
          reserveIconSpace
          title={t('withdraw')}
          subtitle={row.to}
          amount={row.amount.replace(/\s+HIVE$/i, '')}
          amountSuffix="HIVE"
          amountOnClick={() =>
            setSavingsProgress({
              amount: row.amount.replace(/\s+HIVE$/i, ''),
              asset: 'HIVE',
              daysRemaining: row.daysRemaining,
            })
          }
          actions={
            actions
              ? {
                  primaryLabel: t('cancel'),
                  onPrimary: () =>
                    openModal({
                      kind: 'cancelSavingsWithdraw',
                      requestId: row.requestId,
                      amount: row.amount,
                      asset: 'HIVE',
                    }),
                }
              : null
          }
        />
      ))}
      <HiveWalletBalanceRow
        icon={<HbdTokenIcon />}
        iconFullBleed
        title={t('wallet_hbd_token')}
        subtitle={t('wallet_hbd_stable_info')}
        amount={summary.display.hbdLiquid}
        amountSuffix="HBD"
        actions={
          actions
            ? {
                primaryLabel: t('transfer'),
                onPrimary: actions.openTransferHbd,
                menuItems: [
                  {
                    id: 'to-savings',
                    label: t('transfer_to_savings_title'),
                    onSelect: actions.openTransferHbdToSavings,
                  },
                ],
              }
            : null
        }
      />
      <HiveWalletBalanceRow
        icon={<HbdSavingsShieldIcon />}
        iconVariant="plain"
        title={t('wallet_hbd_savings')}
        subtitle={t('wallet_hbd_savings_interest')}
        amount={summary.display.hbdSavings}
        amountSuffix="HBD"
        actions={
          actions
            ? {
                primaryLabel: t('withdraw'),
                onPrimary: actions.openWithdrawHbdSavings,
                menuItems: [
                  {
                    id: 'deposit',
                    label: t('deposit'),
                    onSelect: actions.openDepositHbdSavings,
                  },
                ],
              }
            : null
        }
      />
      {hbdPending.map((row) => (
        <HiveWalletBalanceRow
          key={`hbd-pending-${row.requestId}`}
          reserveIconSpace
          title={t('withdraw')}
          subtitle={row.to}
          amount={row.amount.replace(/\s+HBD$/i, '')}
          amountSuffix="HBD"
          amountOnClick={() =>
            setSavingsProgress({
              amount: row.amount.replace(/\s+HBD$/i, ''),
              asset: 'HBD',
              daysRemaining: row.daysRemaining,
            })
          }
          actions={
            actions
              ? {
                  primaryLabel: t('cancel'),
                  onPrimary: () =>
                    openModal({
                      kind: 'cancelSavingsWithdraw',
                      requestId: row.requestId,
                      amount: row.amount,
                      asset: 'HBD',
                    }),
                }
              : null
          }
        />
      ))}
      {summary.flags.showInterestRow ? (
        <HiveWalletBalanceRow
          reserveIconSpace
          title={t('wallet_interest_title')}
          subtitle={t('wallet_interest_info')}
          amount={summary.display.hbdInterest}
          amountSuffix="HBD"
          showBorderBottom={false}
          actions={
            actions
              ? {
                  primaryLabel: t('wallet_claim'),
                  onPrimary: () => void actions.openClaimInterest(),
                  primaryDisabled:
                    claimPending || summary.interest?.canClaim !== true,
                  primaryDisabledTooltip: claimDisabledTooltip,
                }
              : null
          }
        />
      ) : null}
      </div>
      {summary.rc ? (
        <WalletRcDetailsModal
          open={rcDetailsOpen}
          onClose={() => setRcDetailsOpen(false)}
          rc={summary.rc}
        />
      ) : null}
      {summary.powerDown ? (
        <WalletPowerDownProgressModal
          open={powerDownProgressOpen}
          onClose={() => setPowerDownProgressOpen(false)}
          title={t('power_down')}
          amount={summary.powerDown.vestingWithdrawRateHp}
          symbol="HP"
          nextDateLabel={powerDownNextLabel}
          weeksRemaining={summary.powerDown.weeksRemaining}
          weeksTotal={summary.powerDown.weeksTotal}
        />
      ) : null}
      {savingsProgress ? (
        <WalletSavingsWithdrawProgressModal
          open
          onClose={() => setSavingsProgress(null)}
          amount={savingsProgress.amount}
          asset={savingsProgress.asset}
          daysRemaining={savingsProgress.daysRemaining}
        />
      ) : null}
      <WalletDelegationsListModal
        open={hpDelegationsOpen}
        onClose={() => setHpDelegationsOpen(false)}
        account={accountName}
        variant="hiveHp"
      />
      <WalletDelegationsListModal
        open={rcDelegationsOpen}
        onClose={() => setRcDelegationsOpen(false)}
        account={accountName}
        variant="hiveRc"
      />
    </section>
  );
}
