'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  formatWaivAmountViewLabel,
  WaivWalletAmount,
  WalletDualAmount,
  WalletHistoryRowShell,
} from '@/modules/user-wallet/presentation/components/hive/history/wallet-history-row-shell';

import {
  buildLedgerPaymentAmountView,
  buildLedgerPaymentDeclaredLabel,
  canConfirmLedgerPayment,
  hasPaymentDeclaredMismatch,
} from '../../../domain/ledger-payment-amount';
import type { LedgerPaymentRow } from '../../../domain/ledger.types';
import {
  extractPaymentRefNote,
  parsePaymentRefAuthorperm,
} from '../../../domain/payment-ref';
import { StateBadge } from '../state-badge';

export type RelationshipPaymentRowProps = {
  payment: LedgerPaymentRow;
  viewer: string;
  isBusy: boolean;
  onConfirm: (payment: LedgerPaymentRow) => void;
};

function ProfileLink({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Link href={`/@${name}`} className="text-link" suppressHydrationWarning>
      {children}
    </Link>
  );
}

function PostLink({
  author,
  permlink,
  children,
}: {
  author: string;
  permlink: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/@${author}/${permlink}`}
      className="text-link"
      suppressHydrationWarning
    >
      {children}
    </Link>
  );
}

function paymentDescription(
  payment: LedgerPaymentRow,
  viewer: string,
  t: (key: string) => string,
): ReactNode {
  const postRef =
    payment.method === 'upvote_reward'
      ? parsePaymentRefAuthorperm(payment.ref)
      : null;
  if (postRef) {
    return (
      <>
        {t('business_payment_curation_reward')}{' '}
        <PostLink author={postRef.author} permlink={postRef.permlink}>
          @{postRef.author}/{postRef.permlink}
        </PostLink>
      </>
    );
  }

  const counterparty = payment.payer === viewer ? payment.receiver : payment.payer;
  const isOutgoing = payment.payer === viewer;

  if (isOutgoing) {
    return (
      <>
        {t('activity_transferred')} {t('activity_to')}{' '}
        <ProfileLink name={counterparty}>@{counterparty}</ProfileLink>
      </>
    );
  }

  return (
    <>
      {t('activity_received')} {t('activity_from')}{' '}
      <ProfileLink name={counterparty}>@{counterparty}</ProfileLink>
    </>
  );
}

export function RelationshipPaymentRow({
  payment,
  viewer,
  isBusy,
  onConfirm,
}: RelationshipPaymentRowProps) {
  const { t } = useI18n();
  const amountView = buildLedgerPaymentAmountView(viewer, payment);
  const clickable = canConfirmLedgerPayment(payment, viewer);
  const refNote = extractPaymentRefNote(payment.ref);
  const showDeclaredMismatch = hasPaymentDeclaredMismatch(payment);

  const amount = showDeclaredMismatch ? (
    <WalletDualAmount
      transfer={buildLedgerPaymentDeclaredLabel(payment)}
      received={formatWaivAmountViewLabel(amountView)}
      transferTone="neutral"
      receivedTone={amountView.tone}
      transferSign="none"
      receivedSign={amountView.sign}
    />
  ) : (
    <WaivWalletAmount view={amountView} />
  );

  const body = (
    <WalletHistoryRowShell
      timestamp={payment.created_at}
      amount={amount}
      secondary={
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge variant={payment.state === 'pending' ? 'pending' : 'confirmed'} />
            <span className="text-caption text-fg-secondary">{payment.method}</span>
            {clickable ? (
              <span className="text-caption text-link">
                {t('business_payment_awaiting_confirm')}
              </span>
            ) : null}
          </div>
          {refNote ? (
            <p className="text-caption text-fg-secondary">{refNote}</p>
          ) : null}
        </div>
      }
    >
      {paymentDescription(payment, viewer, t)}
    </WalletHistoryRowShell>
  );

  if (!clickable) {
    return <div className={isBusy ? 'opacity-50' : undefined}>{body}</div>;
  }

  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={() => onConfirm(payment)}
      className={[
        'w-full text-start',
        'cursor-pointer rounded-card transition-colors hover:bg-surface-alt',
        isBusy ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      {body}
    </button>
  );
}
