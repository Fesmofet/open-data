'use client';

import { WalletModalFieldLabel } from './wallet-modal-field-label';

export type WalletModalReadonlyAmountRowProps = {
  label: string;
  value: string;
  suffix: string;
};

export function WalletModalReadonlyAmountRow({
  label,
  value,
  suffix,
}: WalletModalReadonlyAmountRowProps) {
  return (
    <div className="mt-4">
      <WalletModalFieldLabel>{label}</WalletModalFieldLabel>
      <div className="mt-1 flex items-stretch gap-2">
        <input
          disabled
          readOnly
          className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body text-fg disabled:cursor-default disabled:opacity-100"
          value={value}
          aria-label={label}
        />
        <div className="shrink-0 rounded-btn border border-border bg-surface px-3 py-2 text-body text-fg">
          {suffix}
        </div>
      </div>
    </div>
  );
}
