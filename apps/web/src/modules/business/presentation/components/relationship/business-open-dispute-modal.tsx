'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { sumBeneficiaryAmounts } from '../../../domain/invoice-issue';
import type { LedgerInvoiceRow } from '../../../domain/ledger.types';
import { fetchOblInvoiceDetailClient } from '../../../infrastructure/clients/obl-ledger.client';
import type { OblObligationLineApiRow } from '../../../infrastructure/clients/obl-ledger.server';
import { InvoiceObligationLinesTable } from './invoice-obligation-lines-table';
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
  const [lines, setLines] = useState<OblObligationLineApiRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const isMultiKnown = invoice?.kind === 'multi';
  const linesLoadedMulti = lines.length > 1;
  const isMulti = linesLoadedMulti || isMultiKnown;
  const multiTotal = linesLoadedMulti
    ? sumBeneficiaryAmounts(lines.map((l) => ({ amountUsd: l.amount_usd })))
    : null;

  useEffect(() => {
    if (!invoice) {
      return;
    }
    setProposedAmount(invoice.amount_usd);
    setLines([]);
    setDetailError(null);
    if (!open) {
      return;
    }
    setDetailLoading(true);
    void fetchOblInvoiceDetailClient(invoice.invoice_id)
      .then((detail) => {
        const invoiceLines = detail.invoice.lines ?? [];
        setLines(invoiceLines);
        if (invoiceLines.length > 1) {
          setProposedAmount(
            sumBeneficiaryAmounts(invoiceLines.map((l) => ({ amountUsd: l.amount_usd }))),
          );
        }
      })
      .catch(() => {
        setDetailError(t('business_invoice_detail_load_failed'));
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [invoice, open, t]);

  const canSubmit =
    !isBusy &&
    invoice !== null &&
    parseNonNegativeUsdAmount(proposedAmount) &&
    !(isMultiKnown && (detailLoading || detailError !== null || !linesLoadedMulti));

  if (!invoice) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeOnBackdrop={!isBusy}
      labelledBy={titleId}
      maxWidthClass="max-w-lg"
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
        {detailLoading ? (
          <p className="text-caption text-fg-secondary">{t('business_loading')}</p>
        ) : null}
        {detailError ? (
          <p className="text-caption text-error" role="alert">
            {detailError}
          </p>
        ) : null}
        {linesLoadedMulti ? (
          <InvoiceObligationLinesTable lines={lines} totalUsd={multiTotal ?? undefined} />
        ) : !isMultiKnown ? (
          <>
            <RelationshipReadonlyField
              label={t('business_field_original_amount')}
              value={`$${invoice.amount_usd}`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <RelationshipReadonlyField label={t('business_field_debtor')} value={`@${invoice.debtor}`} />
              <RelationshipReadonlyField label={t('business_field_creditor')} value={`@${invoice.creditor}`} />
            </div>
          </>
        ) : null}
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_field_proposed_amount')}
          <input
            type="text"
            inputMode="decimal"
            value={proposedAmount}
            onChange={(e) => setProposedAmount(e.target.value)}
            disabled={isMulti}
            className="rounded-btn border border-border px-3 py-2 disabled:opacity-60"
          />
          {isMulti ? (
            <span className="text-caption text-fg-secondary">
              {t('business_dispute_multi_proposed_hint')}
            </span>
          ) : null}
        </label>
      </div>
    </ModalShell>
  );
}
