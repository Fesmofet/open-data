'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import type { LedgerPaymentRow } from '../../../domain/ledger.types';
import { BusinessDisclosure } from '../business-disclosure';
import { RelationshipReadonlyField, parsePositiveUsdAmount } from './relationship-modal-fields';

export type BusinessConfirmPaymentModalProps = {
  open: boolean;
  payment: LedgerPaymentRow | null;
  onClose: () => void;
  isBusy: boolean;
  onSubmit: (payment: LedgerPaymentRow, amountUsd: string) => Promise<void>;
};

export function BusinessConfirmPaymentModal({
  open,
  payment,
  onClose,
  isBusy,
  onSubmit,
}: BusinessConfirmPaymentModalProps) {
  const { t } = useI18n();
  const titleId = 'business-confirm-payment-modal-title';
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount_usd);
    }
  }, [payment]);

  const canSubmit = !isBusy && payment !== null && parsePositiveUsdAmount(amount);

  if (!payment) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeOnBackdrop={!isBusy}
      labelledBy={titleId}
      maxWidthClass="max-w-md"
      header={
        <div className="flex items-center justify-between gap-3 border-b border-border px-card-padding py-3">
          <h2 id={titleId} className="text-body font-weight-strong text-heading">
            {t('business_modal_confirm_payment_title')}
          </h2>
          <ModalShellCloseButton onClose={onClose} disabled={isBusy} ariaLabel={t('business_modal_close')} />
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 border-t border-border px-card-padding py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-btn border border-border px-4 py-2 text-body-sm disabled:opacity-50"
          >
            {t('business_modal_cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void onSubmit(payment, amount).then(onClose)}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          >
            {t('business_confirm_received_payment')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <BusinessDisclosure variant="payment_partial_confirm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReadonlyField label={t('business_field_payer')} value={`@${payment.payer}`} />
          <RelationshipReadonlyField label={t('business_field_receiver')} value={`@${payment.receiver}`} />
        </div>
        <RelationshipReadonlyField
          label={t('business_field_declared_amount')}
          value={`$${payment.amount_usd}`}
        />
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_field_confirm_amount')}
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-btn border border-border px-3 py-2"
          />
        </label>
      </div>
    </ModalShell>
  );
}
