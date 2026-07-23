'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { DirectionalUsdView } from '../../domain/ledger.types';

function parseUsd(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatDisplayUsd(amount: number): string {
  return amount.toFixed(2);
}

export function directionalAmountsForViewer(
  viewer: string,
  accountA: string,
  accountB: string,
  bucket: DirectionalUsdView,
): { viewerOwes: number; owesViewer: number } {
  const owesAtoB = parseUsd(bucket.owesAtoB);
  const owesBtoA = parseUsd(bucket.owesBtoA);
  if (viewer === accountA) {
    return { viewerOwes: owesAtoB, owesViewer: owesBtoA };
  }
  if (viewer === accountB) {
    return { viewerOwes: owesBtoA, owesViewer: owesAtoB };
  }
  return { viewerOwes: owesAtoB, owesViewer: owesBtoA };
}

/** netUsd = raw owesBtoA − raw owesAtoB; positive means accountB owes accountA. */
export function viewerNetUsd(
  viewer: string,
  accountA: string,
  accountB: string,
  netUsd: string,
): number {
  const net = parseUsd(netUsd);
  if (viewer === accountA) {
    return net;
  }
  if (viewer === accountB) {
    return -net;
  }
  return net;
}

export function shouldShowPendingWhenSettled(
  viewer: string,
  accountA: string,
  accountB: string,
  confirmed: DirectionalUsdView,
  pending: DirectionalUsdView,
): boolean {
  return (
    viewerNetUsd(viewer, accountA, accountB, confirmed.netUsd) === 0 &&
    viewerNetUsd(viewer, accountA, accountB, pending.netUsd) !== 0
  );
}

export function formatPendingBalanceLine(
  viewer: string,
  counterparty: string,
  accountA: string,
  accountB: string,
  pending: DirectionalUsdView,
  t: (key: string) => string,
): string {
  const viewerNet = viewerNetUsd(viewer, accountA, accountB, pending.netUsd);
  if (viewerNet > 0) {
    return t('business_balance_pending_counterparty_owes_you')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(viewerNet));
  }
  if (viewerNet < 0) {
    return t('business_balance_pending_you_owe_counterparty')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(Math.abs(viewerNet)));
  }
  return '';
}

export type DirectionalUsdProps = {
  viewer: string;
  counterparty: string;
  accountA: string;
  accountB: string;
  bucket: DirectionalUsdView;
};

export function DirectionalUsd({
  viewer,
  counterparty,
  accountA,
  accountB,
  bucket,
}: DirectionalUsdProps) {
  const { t } = useI18n();
  const viewerNet = viewerNetUsd(viewer, accountA, accountB, bucket.netUsd);

  let text: string;
  if (viewerNet > 0) {
    text = t('business_balance_counterparty_owes_you')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(viewerNet));
  } else if (viewerNet < 0) {
    text = t('business_balance_you_owe_counterparty')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(Math.abs(viewerNet)));
  } else {
    text = t('business_balance_settled');
  }

  return (
    <p className="text-body font-weight-strong text-heading" aria-live="polite">
      {text}
    </p>
  );
}
