'use client';

import { isOblUsdAmount, parseOblUsdAmount } from '@opden-data-layer/core/utils/obl-usd-amount';

import { ArrowUpDownIcon } from '@/icons';
export function RelationshipReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="text-body-sm">
      <dt className="text-caption text-fg-secondary">{label}</dt>
      <dd className="mt-0.5 font-mono text-body-sm text-fg">{value}</dd>
    </div>
  );
}

export function AccountPairSwapButton({
  ariaLabel,
  disabled,
  onClick,
}: {
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-btn text-fg-secondary transition-colors hover:bg-surface-alt hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArrowUpDownIcon size={18} className="rotate-90" />
    </button>
  );
}

export function AccountPairSwapRow({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  swapAriaLabel,
  disabled,
  onSwap,
}: {
  leftLabel: string;
  rightLabel: string;
  leftValue: string;
  rightValue: string;
  swapAriaLabel: string;
  disabled: boolean;
  onSwap: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2">
        <span className="text-caption text-fg-secondary">{leftLabel}</span>
        <span aria-hidden className="size-9 shrink-0" />
        <span className="text-caption text-fg-secondary">{rightLabel}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
        <span className="font-mono text-body-sm text-fg">{leftValue}</span>
        <AccountPairSwapButton
          ariaLabel={swapAriaLabel}
          disabled={disabled}
          onClick={onSwap}
        />
        <span className="font-mono text-body-sm text-fg">{rightValue}</span>
      </div>
    </div>
  );
}

export function parsePositiveUsdAmount(raw: string): boolean {
  return isOblUsdAmount(raw, 'positive');
}

export function parseNonNegativeUsdAmount(raw: string): boolean {
  return isOblUsdAmount(raw, 'nonnegative');
}

export function normalizePositiveUsdAmount(raw: string): string | null {
  return parseOblUsdAmount(raw, 'positive');
}

export function normalizeNonNegativeUsdAmount(raw: string): string | null {
  return parseOblUsdAmount(raw, 'nonnegative');
}
