import type { ReactNode } from 'react';

export type WalletSummaryHeaderTone = 'waiv' | 'hive' | 'engine';

/**
 * Soft fills via color-mix — Tailwind `bg-accent/10` does not apply alpha to hex
 * CSS variables (`var(--color-accent)`), so the tint was invisible.
 */
const TONE_BG_CLASS: Record<WalletSummaryHeaderTone, string> = {
  waiv: '[background-color:color-mix(in_srgb,var(--color-accent)_7%,transparent)]',
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
      className={`flex items-center gap-4 border-b border-border px-card-padding py-4 ${TONE_BG_CLASS[tone]}`}
    >
      <div className="h-10 w-10 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-weight-strong text-fg">{title}</p>
        <p className="text-body-sm text-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <p className="text-body-sm text-muted">{estAccountValueLabel}</p>
        <p className="text-body font-weight-strong text-fg tabular-nums">
          {estAccountValue}
        </p>
      </div>
    </div>
  );
}
