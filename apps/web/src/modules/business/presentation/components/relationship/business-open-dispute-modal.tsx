'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import type { LedgerInvoiceRow } from '../../../domain/ledger.types';
import { RelationshipReadonlyField, parseNonNegativeUsdAmount } from './relationship-modal-fields';

export type BusinessOpenDisputeModalProps = {
  open: boolean;
  invoice: LedgerInvoiceRow | null;
  onClose: () => void;
  isBusy: boolean;
  onSubmit: (invoice: LedgerInvoiceRow, proposedAmountUsd: string) => Promise<void>;
};

export function BusinessOpenDisputeModal({
  open,
  invoice,
  onClose,
  isBusy,
  onSubmit,
}: BusinessOpenDisputeModalProps) {
  const { t } = useI18n();
  const titleId = 'business-open-dispute-modal-title';
  const [proposedAmount, setProposedAmount] = useState('');

  useEffect(() => {
    if (invoice) {
      setProposedAmount(invoice.amount_usd);
    }
  }, [invoice]);

  const canSubmit = !isBusy && invoice !== null && parseNonNegativeUsdAmount(proposedAmount);

  if (!invoice) {
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
            {t('business_modal_open_dispute_title')}
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
            onClick={() => void onSubmit(invoice, proposedAmount).then(onClose)}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          >
            {t('business_invoice_dispute_action')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <RelationshipReadonlyField label={t('business_field_invoice')} value={invoice.invoice_id} />
        <RelationshipReadonlyField
          label={t('business_field_original_amount')}
          value={`$${invoice.amount_usd}`}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReadonlyField label={t('business_field_debtor')} value={`@${invoice.debtor}`} />
          <RelationshipReadonlyField label={t('business_field_creditor')} value={`@${invoice.creditor}`} />
        </div>
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_field_proposed_amount')}
          <input
            type="text"
            inputMode="decimal"
            value={proposedAmount}
            onChange={(e) => setProposedAmount(e.target.value)}
            className="rounded-btn border border-border px-3 py-2"
          />
        </label>
      </div>
    </ModalShell>
  );
}
