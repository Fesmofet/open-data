'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { WalletActionSplit, type WalletActionSplitItem } from '../shared/wallet-action-split';
import { WalletBalanceAmount } from '../shared/wallet-balance-amount';
import {
  WALLET_ROW_TOKEN_ICON_PX,
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

const SAVINGS_SHIELD_PATH =
  'M17.4652 2.02483L9.79808 0.0119167C9.71335 -0.00397225 9.62653 -0.00397225 9.5418 0.0119167C9.47101 0.00091029 9.39902 0.00091029 9.32823 0.0119167L1.61842 2.02483C1.12958 2.15053 0.699618 2.45022 0.40455 2.8709C0.109482 3.29159 -0.0316929 3.80619 0.00598155 4.32374L0.454475 10.3845C0.634096 12.7887 1.44965 15.0963 2.81259 17.0567C4.17554 19.0172 6.0338 20.5556 8.18564 21.505L9.12534 21.923C9.24377 21.9738 9.37079 22 9.49909 22C9.62738 22 9.75441 21.9738 9.87283 21.923L10.8125 21.505C12.9644 20.5556 14.8226 19.0172 16.1856 17.0567C17.5485 15.0963 18.3641 12.7887 18.5437 10.3845L18.9922 4.32374C19.0343 3.8179 18.9052 3.31263 18.6269 2.89363C18.3486 2.47462 17.9381 2.16767 17.4652 2.02483ZM13.5035 8.49256L9.23213 12.8924C9.13286 12.9955 9.01475 13.0773 8.88463 13.1331C8.7545 13.189 8.61493 13.2177 8.47396 13.2177C8.33299 13.2177 8.19342 13.189 8.06329 13.1331C7.93317 13.0773 7.81506 12.9955 7.71579 12.8924L5.58011 10.6925C5.37903 10.4853 5.26607 10.2044 5.26607 9.9115C5.26607 9.61858 5.37903 9.33766 5.58011 9.13054C5.78119 8.92341 6.05391 8.80705 6.33828 8.80705C6.62265 8.80705 6.89537 8.92341 7.09645 9.13054L8.47396 10.5605L11.9872 6.93063C12.1882 6.7235 12.461 6.60714 12.7453 6.60714C13.0297 6.60714 13.3024 6.7235 13.5035 6.93063C13.7046 7.13775 13.8175 7.41868 13.8175 7.7116C13.8175 8.00452 13.7046 8.28544 13.5035 8.49256Z';

export function HiveSavingsShieldIcon() {
  return (
    <svg width="19" height="22" viewBox="0 0 19 22" fill="none" aria-hidden>
      <path d={SAVINGS_SHIELD_PATH} fill="#E31337" />
    </svg>
  );
}

export function HbdSavingsShieldIcon() {
  return (
    <svg width="19" height="22" viewBox="0 0 19 22" fill="none" aria-hidden>
      <path d={SAVINGS_SHIELD_PATH} fill="#01960E" />
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
