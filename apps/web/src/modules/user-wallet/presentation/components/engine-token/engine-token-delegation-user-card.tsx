'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ClockIcon } from '@/icons';
import { formatEngineTokenAmountDisplay } from '../../../domain/engine-token-amount';
import { getWalletDelegateAmountAssetLabel } from '../../../domain/wallet-power-labels';
import type { WalletMainAsset } from '../../../domain/wallet-modal-types';
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
  return getWalletDelegateAmountAssetLabel(symbol as WalletMainAsset);
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
            <ClockIcon size="md" className="shrink-0" />
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
