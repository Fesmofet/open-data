'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { formatEngineTokenAmountDisplay } from '../../../domain/engine-token-amount';
import { UserAvatar } from '@/shared/presentation';

export type EngineTokenDelegationUserCardProps = {
  username: string;
  quantity: string;
  symbol: string;
  action?: ReactNode;
};

function delegationAmountSuffix(symbol: string): string {
  return symbol === 'WAIV' ? 'WP' : symbol;
}

export function EngineTokenDelegationUserCard({
  username,
  quantity,
  symbol,
  action,
}: EngineTokenDelegationUserCardProps) {
  const profileHref = `/@${encodeURIComponent(username)}`;
  const amountSuffix = delegationAmountSuffix(symbol);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <Link
          href={profileHref}
          className="flex min-w-0 items-center gap-2.5 rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          suppressHydrationWarning
        >
          <UserAvatar username={username} displayName={username} size={45} />
          <span className="truncate text-body-sm font-weight-label text-fg">
            {username}
          </span>
        </Link>
        <span className="shrink-0 tabular-nums text-body-sm text-fg">
          {formatEngineTokenAmountDisplay(quantity)} {amountSuffix}
        </span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
