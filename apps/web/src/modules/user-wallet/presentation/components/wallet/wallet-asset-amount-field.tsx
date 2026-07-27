'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';
import { WalletSearchableAssetSelect } from './wallet-searchable-asset-select';

export type WalletAssetAmountOption<T extends string> = {
  value: T;
  label: string;
  balance: string;
};

export type WalletAssetAmountFieldProps<T extends string> = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  asset: T;
  onAssetChange: (asset: T) => void;
  options: WalletAssetAmountOption<T>[];
  assetDisabled?: boolean;
  maxAmount: string;
  placeholder?: string;
  amountReadOnly?: boolean;
  /** Search/filter token list (swap modal). */
  searchableAsset?: boolean;
  /** When false, asset select shows label only (power modal). */
  showBalanceInAssetSelect?: boolean;
};

export function WalletAssetAmountField<T extends string>({
  label,
  value,
  onChange,
  asset,
  onAssetChange,
  options,
  assetDisabled = false,
  maxAmount,
  placeholder,
  amountReadOnly = false,
  searchableAsset = false,
  showBalanceInAssetSelect = true,
}: WalletAssetAmountFieldProps<T>) {
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
            readOnly={amountReadOnly}
            className={[
              'min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-body text-fg outline-none focus:ring-0',
              amountReadOnly ? 'cursor-default text-muted' : '',
            ].join(' ')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="shrink-0 self-center px-2 text-caption text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canUseMax || amountReadOnly}
            onClick={() => {
              if (!canUseMax) {
                return;
              }
              onChange(maxAmount);
            }}
          >
            {t('max')}
          </button>
          {searchableAsset ? (
            <WalletSearchableAssetSelect
              value={asset}
              options={options}
              onChange={onAssetChange}
              disabled={assetDisabled || options.length <= 1}
              ariaLabel={t('object_edit_wallet_symbol')}
              showBalanceInMenu={showBalanceInAssetSelect}
              showLabelOnTrigger={!showBalanceInAssetSelect}
            />
          ) : (
          <select
            aria-label={t('object_edit_wallet_symbol')}
            className="max-w-[9rem] shrink-0 border-0 border-l border-border bg-surface px-2 py-2 text-body-sm text-fg outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            value={asset}
            disabled={assetDisabled || options.length <= 1}
            onChange={(e) => onAssetChange(e.target.value as T)}
          >
            {options.length === 0 ? (
              <option value={asset}>{asset || '…'}</option>
            ) : (
              options.map((option) => (
                <option key={option.value} value={option.value}>
                  {showBalanceInAssetSelect
                    ? `${option.label} (${formatWalletModalBalanceDisplay(option.balance)})`
                    : option.label}
                </option>
              ))
            )}
          </select>
          )}
        </div>
      </div>
    </div>
  );
}
