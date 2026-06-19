'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type WalletModalBalanceLineProps = {
  amount: string;
  symbol: string;
  onSelect: () => void;
};

export function WalletModalBalanceLine({
  amount,
  symbol,
  onSelect,
}: WalletModalBalanceLineProps) {
  const { t } = useI18n();
  const maxNumeric = Number.parseFloat(amount);
  const canSelect = Number.isFinite(maxNumeric) && maxNumeric > 0;

  return (
    <p className="mt-2 text-body-sm text-muted">
      {t('balance_amount')}:{' '}
      <button
        type="button"
        className="border-b border-dotted border-muted text-fg hover:text-accent disabled:cursor-default disabled:border-none disabled:hover:text-fg"
        disabled={!canSelect}
        onClick={onSelect}
      >
        {amount} {symbol}
      </button>
    </p>
  );
}
