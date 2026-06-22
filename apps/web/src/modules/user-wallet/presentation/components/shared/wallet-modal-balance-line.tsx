'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';

export type WalletModalBalanceLineProps = {
  amount: string;
  symbol: string;
  onSelect: () => void;
  /** When set, shown instead of formatting `amount` (e.g. RC billions). */
  displayAmount?: string;
};

export function WalletModalBalanceLine({
  amount,
  symbol,
  onSelect,
  displayAmount,
}: WalletModalBalanceLineProps) {
  const { t } = useI18n();
  const maxNumeric = Number.parseFloat(amount);
  const canSelect = Number.isFinite(maxNumeric) && maxNumeric > 0;
  const renderedAmount = displayAmount ?? formatWalletModalBalanceDisplay(amount);

  return (
    <p className="mt-2 text-body-sm text-muted">
      {t('balance_amount')}:{' '}
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
