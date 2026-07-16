'use client';

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
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-90"
        aria-hidden
      >
        <path d="M7 16V4M7 4L3 8M7 4L11 8" />
        <path d="M17 8V20M17 20L21 16M17 20L13 16" />
      </svg>
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
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) && n > 0;
}
