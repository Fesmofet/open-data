'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';

export type EngineTokenAmountFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  maxAmount: string;
  placeholder?: string;
  /** Fixed suffix in the amount row (e.g. WAIV / WAIV Power). */
  assetSuffix?: string;
};

export function EngineTokenAmountField({
  label,
  value,
  onChange,
  maxAmount,
  placeholder,
  assetSuffix,
}: EngineTokenAmountFieldProps) {
  const { t } = useI18n();
  const inputId = useId();
  const maxNumeric = Number.parseFloat(maxAmount);
  const canUseMax = Number.isFinite(maxNumeric) && maxNumeric > 0;

  return (
    <div>
      {label ? <WalletModalFieldLabel>{label}</WalletModalFieldLabel> : null}
      <div className={label ? 'mt-1' : undefined}>
        <div className="flex items-stretch overflow-hidden rounded-btn border border-border bg-bg">
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            aria-label={label}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-body text-fg outline-none focus:ring-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="my-1 mr-1 shrink-0 self-center rounded-btn border border-border bg-surface px-1.5 py-0.5 text-caption text-fg hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canUseMax}
            onClick={() => {
              if (!canUseMax) {
                return;
              }
              onChange(maxAmount);
            }}
          >
            {t('max')}
          </button>
          {assetSuffix ? (
            <div className="shrink-0 border-l border-border bg-surface px-2 py-2 text-body-sm text-fg">
              {assetSuffix}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
