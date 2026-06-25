'use client';

import type { ReactNode } from 'react';

import type { WaivAmountView } from '@/modules/user-wallet/domain/types/waiv-wallet-history-view';
import { ActivityTimestamp } from '@/modules/user-activity/presentation/components/activity-timestamp';

/** Display label for pre-formatted {@link WaivAmountView.amount} — do not re-run quantity formatting. */
export function formatWaivAmountViewLabel(view: WaivAmountView): string {
  if (!view.amount) {
    return view.currency;
  }
  return view.currency ? `${view.amount} ${view.currency}` : view.amount;
}

type WalletHistoryRowShellProps = {
  icon?: ReactNode;
  avatar?: ReactNode;
  children: ReactNode;
  amount?: ReactNode;
  timestamp: string;
  /** Shown on the same row as the timestamp (legacy swap/market rate line). */
  timestampExtra?: ReactNode;
  secondary?: ReactNode;
};

export function WalletHistoryRowShell({
  icon,
  avatar,
  children,
  amount,
  timestamp,
  timestampExtra,
  secondary,
}: WalletHistoryRowShellProps) {
  return (
    <article className="rounded-card border border-border bg-surface/80 p-card-padding">
      <div className="flex gap-3">
        {avatar ? (
          <div className="mt-0.5 shrink-0">{avatar}</div>
        ) : icon ? (
          <div
            className="mt-0.5 flex h-10 w-11 shrink-0 items-center justify-center rounded-btn bg-surface-muted text-muted"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 break-words text-body-sm text-fg">
              {children}
            </div>
            {amount ? (
              <div className="shrink-0 text-right text-body-sm font-weight-label whitespace-nowrap">
                {amount}
              </div>
            ) : null}
          </div>
          {timestampExtra ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <ActivityTimestamp
                timestamp={timestamp}
                className="text-caption text-muted"
              />
              <span className="shrink-0 text-caption text-muted">{timestampExtra}</span>
            </div>
          ) : (
            <ActivityTimestamp
              timestamp={timestamp}
              className="mt-1 block text-caption text-muted"
            />
          )}
          {secondary ? <div className="mt-2">{secondary}</div> : null}
        </div>
      </div>
    </article>
  );
}

export function WalletAmount({
  value,
  tone,
}: {
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  if (tone === 'positive') {
    return <span className="text-success">+ {value}</span>;
  }
  if (tone === 'negative') {
    return <span className="text-error">- {value}</span>;
  }
  return <span className="text-fg">{value}</span>;
}

export function WaivWalletAmount({ view }: { view: WaivAmountView }) {
  const label = formatWaivAmountViewLabel(view);
  const colorClass =
    view.tone === 'positive'
      ? 'text-success'
      : view.tone === 'negative'
        ? 'text-error'
        : 'text-fg';

  if (view.sign === 'none') {
    return <span className={colorClass}>{label}</span>;
  }

  return (
    <span className={colorClass}>
      {view.sign} {label}
    </span>
  );
}

export function WalletDualAmount({
  transfer,
  received,
  transferTone = 'negative',
  receivedTone = 'positive',
  transferSign = '-',
  receivedSign = '+',
}: {
  transfer: string;
  received: string;
  transferTone?: 'positive' | 'negative' | 'neutral';
  receivedTone?: 'positive' | 'negative' | 'neutral';
  transferSign?: '+' | '-' | 'none';
  receivedSign?: '+' | '-' | 'none';
}) {
  const transferPrefix = transferSign === 'none' ? '' : `${transferSign} `;
  const receivedPrefix = receivedSign === 'none' ? '' : `${receivedSign} `;
  const transferClass =
    transferTone === 'positive'
      ? 'text-success'
      : transferTone === 'negative'
        ? 'text-error'
        : 'text-fg';
  const receivedClass =
    receivedTone === 'positive'
      ? 'text-success'
      : receivedTone === 'negative'
        ? 'text-error'
        : 'text-fg';

  return (
    <span className="inline-flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <span className={transferClass}>
        {transferPrefix}
        {transfer}
      </span>
      <span className={receivedClass}>
        {receivedPrefix}
        {received}
      </span>
    </span>
  );
}
