'use client';

import type { ReactNode } from 'react';

import { WalletHoverTooltip } from './wallet-hover-tooltip';

export type WalletBalanceAmountProps = {
  amount: string;
  amountSuffix?: string;
  onClick?: () => void;
  tooltip?: ReactNode;
  tooltipDisabled?: boolean;
};

export function WalletBalanceAmount({
  amount,
  amountSuffix,
  onClick,
  tooltip,
  tooltipDisabled,
}: WalletBalanceAmountProps) {
  const interactive = Boolean(onClick);
  const amountClass = [
    'text-body font-weight-strong text-fg tabular-nums',
    interactive ? 'cursor-pointer' : '',
  ].join(' ');

  const amountNode = interactive ? (
    <button type="button" className={amountClass} onClick={onClick}>
      {amount}
      {amountSuffix ? (
        <span className="ml-1 text-body-sm font-weight-body text-muted">
          {amountSuffix}
        </span>
      ) : null}
    </button>
  ) : (
    <span className={amountClass}>
      {amount}
      {amountSuffix ? (
        <span className="ml-1 text-body-sm font-weight-body text-muted">
          {amountSuffix}
        </span>
      ) : null}
    </span>
  );

  if (!tooltip) {
    return amountNode;
  }

  return (
    <WalletHoverTooltip content={tooltip} disabled={tooltipDisabled}>
      {amountNode}
    </WalletHoverTooltip>
  );
}
