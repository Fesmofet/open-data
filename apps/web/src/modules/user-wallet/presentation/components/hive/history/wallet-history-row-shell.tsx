'use client';

import type { ReactNode } from 'react';

import { ActivityTimestamp } from '@/modules/user-activity/presentation/components/activity-timestamp';

type WalletHistoryRowShellProps = {
  icon?: ReactNode;
  avatar?: ReactNode;
  children: ReactNode;
  amount?: ReactNode;
  timestamp: string;
  secondary?: ReactNode;
};

export function WalletHistoryRowShell({
  icon,
  avatar,
  children,
  amount,
  timestamp,
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
          <ActivityTimestamp
            timestamp={timestamp}
            className="mt-1 block text-caption text-muted"
          />
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

export function WalletDualAmount({
  transfer,
  received,
}: {
  transfer: string;
  received: string;
}) {
  return (
    <span className="inline-flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <WalletAmount value={transfer} tone="negative" />
      <WalletAmount value={received} tone="positive" />
    </span>
  );
}
