'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { shortContractId } from '../../../domain/dispute-resolution';
import type { LedgerContractRow } from '../../../domain/ledger.types';
import { parseMetadataJson } from '../../../domain/offer-terms';

export type BusinessCreateServiceOrderModalProps = {
  open: boolean;
  onClose: () => void;
  isBusy: boolean;
  contracts: LedgerContractRow[];
  onSubmit: (input: {
    contractId: string;
    details?: Record<string, unknown>;
  }) => Promise<void>;
};

export function BusinessCreateServiceOrderModal({
  open,
  onClose,
  isBusy,
  contracts,
  onSubmit,
}: BusinessCreateServiceOrderModalProps) {
  const { t } = useI18n();
  const titleId = 'business-create-service-order-modal-title';
  const [contractId, setContractId] = useState('');
  const [detailsJson, setDetailsJson] = useState('');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setContractId(contracts[0]?.contract_id ?? '');
      setDetailsJson('');
      setDetailsError(null);
    }
  }, [open, contracts]);

  const canSubmit = !isBusy && contractId.trim().length > 0 && detailsError === null;

  async function handleSubmit() {
    const trimmed = detailsJson.trim();
    let details: Record<string, unknown> | undefined;
    if (trimmed.length > 0) {
      const parsed = parseMetadataJson(trimmed);
      if (parsed === null) {
        setDetailsError(t('business_invoice_details_invalid_json'));
        return;
      }
      details = Object.keys(parsed).length > 0 ? parsed : undefined;
    }
    await onSubmit({ contractId, details });
    onClose();
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
            {t('business_create_service_order')}
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
            disabled={!canSubmit || contracts.length === 0}
            onClick={() => void handleSubmit()}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm text-accent-fg disabled:opacity-50"
          >
            {t('business_create_service_order_submit')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-card-padding py-4">
        {contracts.length === 0 ? (
          <p className="text-caption text-error" role="alert">
            {t('business_service_order_contract_required_missing')}
          </p>
        ) : (
          <label className="flex flex-col gap-1 text-body-sm">
            {t('business_field_contract')}
            <select
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              className="rounded-btn border border-border px-3 py-2"
            >
              {contracts.map((c) => (
                <option key={c.contract_id} value={c.contract_id}>
                  {c.offer_name} · {shortContractId(c.contract_id)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_service_order_details_label')}
          <textarea
            value={detailsJson}
            onChange={(e) => {
              setDetailsJson(e.target.value);
              setDetailsError(null);
            }}
            rows={4}
            className="rounded-btn border border-border px-3 py-2 font-mono text-caption"
            placeholder="{}"
          />
          {detailsError ? <span className="text-caption text-error">{detailsError}</span> : null}
        </label>
      </div>
    </ModalShell>
  );
}
