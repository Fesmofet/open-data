'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { WalletActionSplit, type WalletActionSplitItem } from '../shared/wallet-action-split';
import { WalletBalanceAmount } from '../shared/wallet-balance-amount';
import {
  WALLET_ROW_TOKEN_ICON_PX,
  WalletPowerLightningIcon,
} from '../shared/wallet-row-icons';

/** Waivio wallet tab parity — {@link walletSymbolIconSrc} in object module uses the same file. */
export const WAIV_TOKEN_ICON_SRC = '/images/icons/cryptocurrencies/waiv.png';

export type WaivWalletBalanceRowProps = {
  icon?: ReactNode;
  /** Token image fills the 40×40 circle (no accent glyph background). */
  iconFullBleed?: boolean;
  /** Power lightning: accent color without circle shell. */
  iconVariant?: 'default' | 'accent' | 'plain';
  /** Keeps label column aligned when this row has no icon. */
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

export function WaivWalletBalanceRow({
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
}: WaivWalletBalanceRowProps) {
  const showIconColumn = icon !== undefined || reserveIconSpace;

  const iconShellClass = (() => {
    if (iconVariant === 'accent') {
      return 'flex h-10 w-10 shrink-0 items-center justify-center text-accent';
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

function WaivTokenIcon() {
  return (
    <Image
      src={WAIV_TOKEN_ICON_SRC}
      alt=""
      width={WALLET_ROW_TOKEN_ICON_PX}
      height={WALLET_ROW_TOKEN_ICON_PX}
      className="h-[22px] w-[22px] object-contain"
    />
  );
}

function PowerIcon() {
  return <WalletPowerLightningIcon />;
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export { WaivTokenIcon, PowerIcon, PersonIcon };
