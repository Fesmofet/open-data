'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { WalletActionSplit, type WalletActionSplitItem } from '../shared/wallet-action-split';
import { WalletBalanceAmount } from '../shared/wallet-balance-amount';
import {
  WALLET_ROW_TOKEN_ICON_PX,
  WALLET_SAVINGS_SHIELD_HEIGHT,
  WALLET_SAVINGS_SHIELD_PATH,
  WALLET_SAVINGS_SHIELD_WIDTH,
  WalletPowerLightningIcon,
} from '../shared/wallet-row-icons';

export const HIVE_TOKEN_ICON_SRC = '/images/icons/cryptocurrencies/hive.png';
export const HBD_TOKEN_ICON_SRC = '/images/icons/cryptocurrencies/hbd-icon.svg';

export type HiveWalletBalanceRowProps = {
  icon?: ReactNode;
  iconFullBleed?: boolean;
  /** Lightning / person icons: red accent, gray, plain (no shell), or default orange. */
  iconVariant?: 'default' | 'red' | 'gray' | 'plain';
  reserveIconSpace?: boolean;
  title: string;
  subtitle?: string;
  amount: string;
  amountSuffix?: string;
  amountOnClick?: () => void;
  amountTooltip?: ReactNode;
  amountTooltipDisabled?: boolean;
  showBorderBottom?: boolean;
  actions?: {
    primaryLabel: string;
    onPrimary: () => void;
    menuItems?: WalletActionSplitItem[];
    primaryDisabled?: boolean;
    primaryDisabledTooltip?: string;
  } | null;
};

export function HiveWalletBalanceRow({
  icon,
  iconFullBleed = false,
  iconVariant = 'default',
  reserveIconSpace = false,
  title,
  subtitle,
  amount,
  amountSuffix,
  amountOnClick,
  amountTooltip,
  amountTooltipDisabled,
  showBorderBottom = true,
  actions,
}: HiveWalletBalanceRowProps) {
  const showIconColumn = icon !== undefined || reserveIconSpace;

  const iconShellClass = (() => {
    if (iconVariant === 'red') {
      return 'flex h-10 w-10 shrink-0 items-center justify-center text-[#E31337]';
    }
    if (iconVariant === 'gray') {
      return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted';
    }
    if (iconVariant === 'plain') {
      return 'flex h-10 w-10 shrink-0 items-center justify-center';
    }
    return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent';
  })();

  return (
    <div
      className={[
        'flex items-center gap-4 py-4',
        showBorderBottom ? 'border-b border-border' : '',
      ].join(' ')}
    >
      {showIconColumn ? (
        icon ? (
          iconFullBleed ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {icon}
            </div>
          ) : (
            <div className={iconShellClass}>{icon}</div>
          )
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden />
        )
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-body font-weight-strong text-fg">{title}</p>
        {subtitle ? (
          <p className="text-body-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <WalletBalanceAmount
          amount={amount}
          amountSuffix={amountSuffix}
          onClick={amountOnClick}
          tooltip={amountTooltip}
          tooltipDisabled={amountTooltipDisabled}
        />
        {actions ? (
          <WalletActionSplit
            primaryLabel={actions.primaryLabel}
            onPrimary={actions.onPrimary}
            menuItems={actions.menuItems}
            disabled={actions.primaryDisabled}
            disabledTooltip={actions.primaryDisabledTooltip}
          />
        ) : null}
      </div>
    </div>
  );
}

export function HiveTokenIcon() {
  return (
    <Image
      src={HIVE_TOKEN_ICON_SRC}
      alt=""
      width={WALLET_ROW_TOKEN_ICON_PX}
      height={WALLET_ROW_TOKEN_ICON_PX}
      className="h-[22px] w-[22px] object-contain"
    />
  );
}

export function HbdTokenIcon() {
  return (
    <Image
      src={HBD_TOKEN_ICON_SRC}
      alt=""
      width={WALLET_ROW_TOKEN_ICON_PX}
      height={WALLET_ROW_TOKEN_ICON_PX}
      className="h-[22px] w-[22px] object-contain"
    />
  );
}

export function HiveSavingsShieldIcon() {
  return (
    <svg
      width={WALLET_SAVINGS_SHIELD_WIDTH}
      height={WALLET_SAVINGS_SHIELD_HEIGHT}
      viewBox="0 0 19 22"
      fill="none"
      aria-hidden
    >
      <path d={WALLET_SAVINGS_SHIELD_PATH} fill="#E31337" />
    </svg>
  );
}

export function HbdSavingsShieldIcon() {
  return (
    <svg
      width={WALLET_SAVINGS_SHIELD_WIDTH}
      height={WALLET_SAVINGS_SHIELD_HEIGHT}
      viewBox="0 0 19 22"
      fill="none"
      aria-hidden
    >
      <path d={WALLET_SAVINGS_SHIELD_PATH} fill="#01960E" />
    </svg>
  );
}

export function HivePowerIcon() {
  return <WalletPowerLightningIcon />;
}

export function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}
