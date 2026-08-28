'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';

export type WalletModalBalanceLineProps = {
  amount: string;
  symbol: string;
  onSelect: () => void;
  /** When set, shown instead of formatting `amount` (e.g. RC billions). */
  displayAmount?: string;
  labelKey?: 'balance_amount' | 'available' | 'current_balance' | 'your_balance';
  /** When false, balance is plain text (receive/quote rows). Default true. */
  interactive?: boolean;
};

export function WalletModalBalanceLine({
  amount,
  symbol,
  onSelect,
  displayAmount,
  labelKey = 'balance_amount',
  interactive = true,
}: WalletModalBalanceLineProps) {
  const { t } = useI18n();
  const maxNumeric = Number.parseFloat(amount);
  const canSelect = Number.isFinite(maxNumeric) && maxNumeric > 0;
  const renderedAmount = displayAmount ?? formatWalletModalBalanceDisplay(amount);

  if (!interactive) {
    return (
      <p className="mt-2 text-body-sm text-muted">
        {t(labelKey)}:{' '}
        <span className="text-fg">
          {renderedAmount} {symbol}
        </span>
      </p>
    );
  }

  return (
    <p className="mt-2 text-body-sm text-muted">
      {t(labelKey)}:{' '}
      <button
        type="button"
        className="border-b border-dotted border-muted text-fg hover:text-accent disabled:cursor-default disabled:border-none disabled:hover:text-fg"
        disabled={!canSelect}
        onClick={onSelect}
      >
        {renderedAmount} {symbol}
      </button>
    </p>
  );
}
