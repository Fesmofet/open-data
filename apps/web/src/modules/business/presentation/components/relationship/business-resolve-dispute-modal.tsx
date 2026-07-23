'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { sumBeneficiaryAmounts } from '../../../domain/invoice-issue';
import type { LedgerDisputeRow, LedgerInvoiceRow } from '../../../domain/ledger.types';
import type { DisputeAuthority } from '../../../domain/dispute-resolution';
import { formatUsdDisplay } from '../../../domain/dispute-resolution';
import { fetchOblInvoiceDetailClient } from '../../../infrastructure/clients/obl-ledger.client';
import type { OblObligationLineApiRow } from '../../../infrastructure/clients/obl-ledger.server';
import { InvoiceObligationLinesTable } from './invoice-obligation-lines-table';
import { RelationshipReadonlyField, parseNonNegativeUsdAmount } from './relationship-modal-fields';

export type BusinessResolveDisputeModalProps = {
  open: boolean;
  dispute: LedgerDisputeRow | null;
  invoice: LedgerInvoiceRow | null;
  authority: DisputeAuthority | null;
  onClose: () => void;
  isBusy: boolean;
  onSubmit: (dispute: LedgerDisputeRow, finalAmountUsd: string) => Promise<void>;
};

export function BusinessResolveDisputeModal({
  open,
  dispute,
  invoice,
  authority,
  onClose,
  isBusy,
  onSubmit,
}: BusinessResolveDisputeModalProps) {
  const { t } = useI18n();
  const titleId = 'business-resolve-dispute-modal-title';
  const [finalAmount, setFinalAmount] = useState('');
  const [lines, setLines] = useState<OblObligationLineApiRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const isMultiKnown = invoice?.kind === 'multi';
  const linesLoadedMulti = lines.length > 1;
  const multiTotal = linesLoadedMulti
    ? sumBeneficiaryAmounts(lines.map((l) => ({ amountUsd: l.amount_usd })))
    : null;
  const isMulti = linesLoadedMulti || isMultiKnown;
  const canSubmitMulti =
    linesLoadedMulti &&
    multiTotal !== null &&
    !isBusy &&
    !detailLoading &&
    !detailError;

  useEffect(() => {
    if (!open || !dispute) {
      return;
    }
    setFinalAmount(dispute.proposed_amount_usd);
    setLines([]);
    setDetailError(null);
    setDetailLoading(true);
    void fetchOblInvoiceDetailClient(dispute.invoice_id)
      .then((detail) => {
        const invoiceLines = detail.invoice.lines ?? [];
        setLines(invoiceLines);
        if (invoiceLines.length > 1) {
          setFinalAmount(sumBeneficiaryAmounts(invoiceLines.map((l) => ({ amountUsd: l.amount_usd }))));
        }
      })
      .catch(() => {
        setDetailError(t('business_invoice_detail_load_failed'));
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [open, dispute, t]);

  const canSubmitSingle =
    !isBusy &&
    dispute !== null &&
    !isMultiKnown &&
    !linesLoadedMulti &&
    !detailLoading &&
    parseNonNegativeUsdAmount(finalAmount);

  if (!dispute || !authority) {
    return null;
  }

  const ruleLabel =
    authority.rule === 'arbiter'
      ? t('business_dispute_arbiter')
      : authority.rule === 'provider'
        ? t('business_dispute_provider')
        : t('business_dispute_client');

  async function submitMulti(finalUsd: string) {
    await onSubmit(dispute!, finalUsd);
    onClose();
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
            {t('business_modal_resolve_dispute_title')}
          </h2>
          <ModalShellCloseButton onClose={onClose} disabled={isBusy} ariaLabel={t('business_modal_close')} />
        </div>
      }
      footer={
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-card-padding py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-btn border border-border px-4 py-2 text-body-sm disabled:opacity-50"
          >
            {t('business_modal_cancel')}
          </button>
          {linesLoadedMulti && multiTotal ? (
            <>
              <button
                type="button"
                disabled={!canSubmitMulti}
                onClick={() => void submitMulti('0')}
                className="rounded-btn border border-border px-4 py-2 text-body-sm disabled:opacity-50"
              >
                {t('business_dispute_reject_all')}
              </button>
              <button
                type="button"
                disabled={!canSubmitMulti}
                onClick={() => void submitMulti(multiTotal)}
                className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
              >
                {t('business_dispute_accept_all')}
              </button>
            </>
          ) : !isMultiKnown ? (
            <button
              type="button"
              disabled={!canSubmitSingle}
              onClick={() => void onSubmit(dispute, finalAmount).then(onClose)}
              className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
            >
              {t('business_dispute_resolve_action')}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <RelationshipReadonlyField label={t('business_field_invoice')} value={dispute.invoice_id} />
        {invoice ? (
          <RelationshipReadonlyField
            label={t('business_field_original_amount')}
            value={`$${formatUsdDisplay(multiTotal ?? invoice.amount_usd)}`}
          />
        ) : null}
        {detailLoading ? (
          <p className="text-caption text-fg-secondary">{t('business_loading')}</p>
        ) : null}
        {detailError ? (
          <p className="text-caption text-error" role="alert">
            {detailError}
          </p>
        ) : null}
        {linesLoadedMulti ? (
          <>
            <InvoiceObligationLinesTable lines={lines} totalUsd={multiTotal ?? undefined} />
            <p className="text-caption text-fg-secondary">{t('business_dispute_multi_resolve_hint')}</p>
          </>
        ) : isMultiKnown && !detailError ? (
          <p className="text-caption text-fg-secondary">{t('business_dispute_multi_resolve_hint')}</p>
        ) : null}
        <RelationshipReadonlyField label={t('business_field_dispute_rule')} value={ruleLabel} />
        <RelationshipReadonlyField
          label={t('business_field_resolver')}
          value={`@${authority.resolverAccount}`}
        />
        <RelationshipReadonlyField
          label={t('business_field_proposed_amount')}
          value={`$${dispute.proposed_amount_usd}`}
        />
        {!isMultiKnown && !linesLoadedMulti ? (
          <label className="flex flex-col gap-1 text-body-sm">
            {t('business_field_final_amount')}
            <input
              type="text"
              inputMode="decimal"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              className="rounded-btn border border-border px-3 py-2"
            />
          </label>
        ) : null}
      </div>
    </ModalShell>
  );
}
