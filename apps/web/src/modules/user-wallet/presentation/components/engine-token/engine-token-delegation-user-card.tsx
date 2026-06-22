'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatEngineTokenAmountDisplay } from '../../../domain/engine-token-amount';
import { UserAvatar } from '@/shared/presentation';

export type EngineTokenDelegationUserCardProps = {
  username?: string;
  quantity: string;
  symbol: string;
  pending?: boolean;
  symbolOnly?: boolean;
  minimumFractionDigits?: number;
  action?: ReactNode;
};

function delegationAmountSuffix(symbol: string, symbolOnly: boolean): string {
  if (symbolOnly) {
    return symbol;
  }
  if (symbol === 'WAIV') {
    return 'WP';
  }
  if (symbol === 'HIVE') {
    return 'HP';
  }
  return symbol;
}

function formatDelegationQuantity(
  quantity: string,
  minimumFractionDigits: number,
): string {
  const parsed = Number.parseFloat(quantity.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) {
    return formatEngineTokenAmountDisplay(quantity);
  }
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: 3,
  });
}

function DelegationExpiringClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 11h-4V7h2v4h2Z" />
    </svg>
  );
}

export function EngineTokenDelegationUserCard({
  username,
  quantity,
  symbol,
  pending = false,
  symbolOnly = false,
  minimumFractionDigits = 2,
  action,
}: EngineTokenDelegationUserCardProps) {
  const { t } = useI18n();
  const profileHref = `/@${encodeURIComponent(username ?? '')}`;
  const amountSuffix = delegationAmountSuffix(symbol, symbolOnly);
  const amountLabel = `${formatDelegationQuantity(quantity, minimumFractionDigits)} ${amountSuffix}`;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        {pending ? (
          <span className="flex items-center gap-1.5 text-body-sm text-muted">
            <DelegationExpiringClockIcon />
            {t('wallet_delegation_expiring')}
          </span>
        ) : (
          <Link
            href={profileHref}
            className="flex min-w-0 items-center gap-2.5 rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            suppressHydrationWarning
          >
            <UserAvatar username={username ?? ''} displayName={username ?? ''} size={45} />
            <span className="truncate text-body-sm font-weight-label text-fg">
              {username}
            </span>
          </Link>
        )}
        <span className="shrink-0 tabular-nums text-body-sm text-fg">{amountLabel}</span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
