'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { WalletActionSplit, type WalletActionSplitItem } from '../shared/wallet-action-split';

/** Waivio wallet tab parity — {@link walletSymbolIconSrc} in object module uses the same file. */
export const WAIV_TOKEN_ICON_SRC = '/images/icons/cryptocurrencies/waiv.png';

export type WaivWalletBalanceRowProps = {
  icon?: ReactNode;
  /** Token image fills the 40×40 circle (no accent glyph background). */
  iconFullBleed?: boolean;
  /** Keeps label column aligned when this row has no icon. */
  reserveIconSpace?: boolean;
  title: string;
  subtitle?: string;
  amount: string;
  amountSuffix?: string;
  showBorderBottom?: boolean;
  actions?: {
    primaryLabel: string;
    onPrimary: () => void;
    menuItems?: WalletActionSplitItem[];
  } | null;
};

export function WaivWalletBalanceRow({
  icon,
  iconFullBleed = false,
  reserveIconSpace = false,
  title,
  subtitle,
  amount,
  amountSuffix,
  showBorderBottom = true,
  actions,
}: WaivWalletBalanceRowProps) {
  const showIconColumn = icon !== undefined || reserveIconSpace;

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
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              {icon}
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              {icon}
            </div>
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
        <p className="text-body font-weight-strong text-fg tabular-nums">
          {amount}
          {amountSuffix ? (
            <span className="ml-1 text-body-sm font-weight-body text-muted">
              {amountSuffix}
            </span>
          ) : null}
        </p>
        {actions ? (
          <WalletActionSplit
            primaryLabel={actions.primaryLabel}
            onPrimary={actions.onPrimary}
            menuItems={actions.menuItems}
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
      width={40}
      height={40}
      className="h-10 w-10 object-cover"
    />
  );
}

function PowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export { WaivTokenIcon, PowerIcon, PersonIcon };
