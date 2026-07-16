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
  const { viewerOwes, owesViewer } = directionalAmountsForViewer(
    viewer,
    accountA,
    accountB,
    bucket,
  );

  let text: string;
  if (owesViewer > 0 && viewerOwes === 0) {
    text = t('business_balance_counterparty_owes_you')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(owesViewer));
  } else if (viewerOwes > 0 && owesViewer === 0) {
    text = t('business_balance_you_owe_counterparty')
      .replace('@account', `@${counterparty}`)
      .replace('$amount', formatDisplayUsd(viewerOwes));
  } else if (viewerOwes > 0 && owesViewer > 0) {
    const net = owesViewer - viewerOwes;
    if (net > 0) {
      text = t('business_balance_counterparty_owes_you')
        .replace('@account', `@${counterparty}`)
        .replace('$amount', formatDisplayUsd(net));
    } else if (net < 0) {
      text = t('business_balance_you_owe_counterparty')
        .replace('@account', `@${counterparty}`)
        .replace('$amount', formatDisplayUsd(Math.abs(net)));
    } else {
      text = t('business_balance_settled');
    }
  } else {
    text = t('business_balance_settled');
  }

  return (
    <p className="text-body font-weight-strong text-heading" aria-live="polite">
      {text}
    </p>
  );
}
