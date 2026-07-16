'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import type { LedgerDisputeRow, LedgerInvoiceRow } from '../../../domain/ledger.types';
import type { DisputeAuthority } from '../../../domain/dispute-resolution';
import { formatUsdDisplay } from '../../../domain/dispute-resolution';
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

  useEffect(() => {
    if (dispute) {
      setFinalAmount(dispute.proposed_amount_usd);
    }
  }, [dispute]);

  const canSubmit = !isBusy && dispute !== null && parseNonNegativeUsdAmount(finalAmount);

  if (!dispute || !authority) {
    return null;
  }

  const ruleLabel =
    authority.rule === 'arbiter'
      ? t('business_dispute_arbiter')
      : authority.rule === 'provider'
        ? t('business_dispute_provider')
        : t('business_dispute_client');

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
            {t('business_modal_resolve_dispute_title')}
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
            onClick={() => void onSubmit(dispute, finalAmount).then(onClose)}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          >
            {t('business_dispute_resolve_action')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <RelationshipReadonlyField label={t('business_field_invoice')} value={dispute.invoice_id} />
        {invoice ? (
          <RelationshipReadonlyField
            label={t('business_field_original_amount')}
            value={`$${formatUsdDisplay(invoice.amount_usd)}`}
          />
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
      </div>
    </ModalShell>
  );
}
