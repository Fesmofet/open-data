import type { ReactNode } from 'react';

export type WalletSummaryHeaderTone = 'waiv' | 'hive' | 'engine';

const TONE_BG_CLASS: Record<WalletSummaryHeaderTone, string> = {
  waiv: 'bg-accent-soft',
  hive: '[background-color:color-mix(in_srgb,var(--color-error)_7%,transparent)]',
  engine:
    '[background-color:color-mix(in_srgb,var(--color-muted)_10%,transparent)]',
};

export type WalletSummaryHeaderProps = {
  title: string;
  subtitle: string;
  estAccountValueLabel: string;
  estAccountValue: ReactNode;
  tone: WalletSummaryHeaderTone;
};

/**
 * Tinted summary header. Horizontal rhythm matches balance rows:
 * icon column (spacer) + gap-4 + title column + trailing value column.
 */
export function WalletSummaryHeader({
  title,
  subtitle,
  estAccountValueLabel,
  estAccountValue,
  tone,
}: WalletSummaryHeaderProps) {
  return (
    <div
      className={`flex items-start gap-2 border-b border-border px-3 py-3 sm:gap-4 sm:px-card-padding sm:py-4 ${TONE_BG_CLASS[tone]}`}
    >
      <div className="hidden h-10 w-10 shrink-0 sm:block" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-weight-strong leading-snug text-fg">{title}</p>
        <p className="mt-0.5 text-body-sm leading-snug text-muted">{subtitle}</p>
      </div>
      <div className="flex max-w-[42%] shrink-0 flex-col items-end text-right sm:max-w-none">
        <p className="text-caption leading-snug text-muted sm:text-body-sm">
          {estAccountValueLabel}
        </p>
        <p className="mt-0.5 text-body-sm font-weight-strong leading-snug text-fg tabular-nums sm:text-body">
          {estAccountValue}
        </p>
      </div>
    </div>
  );
}
