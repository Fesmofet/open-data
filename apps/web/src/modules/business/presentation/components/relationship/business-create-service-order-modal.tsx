'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { shortContractId } from '../../../domain/dispute-resolution';
import type { LedgerContractRow } from '../../../domain/ledger.types';
import { emptyValueFromSchema } from '../../../domain/service-order-schema';
import { ObjectBuilder } from '../object-builder';

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
  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [detailsValid, setDetailsValid] = useState(true);
  const [detailsBuilderKey, setDetailsBuilderKey] = useState(0);

  function applyContractPrefill(nextContractId: string) {
    const selected = contracts.find((c) => c.contract_id === nextContractId);
    const schema = selected?.service_order_schema;
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      setDetails(emptyValueFromSchema(schema));
    } else {
      setDetails({});
    }
    setDetailsValid(true);
    setDetailsBuilderKey((key) => key + 1);
  }

  useEffect(() => {
    if (open) {
      const initialId = contracts[0]?.contract_id ?? '';
      setContractId(initialId);
      if (initialId) {
        applyContractPrefill(initialId);
      } else {
        setDetails({});
        setDetailsValid(true);
        setDetailsBuilderKey((key) => key + 1);
      }
    }
  }, [open, contracts]);

  const selectedContract = contracts.find((c) => c.contract_id === contractId);
  const hasSchemaPrefill =
    selectedContract?.service_order_schema !== null &&
    selectedContract?.service_order_schema !== undefined &&
    Object.keys(selectedContract.service_order_schema).length > 0;

  const canSubmit =
    !isBusy && contractId.trim().length > 0 && detailsValid;

  async function handleSubmit() {
    const detailsPayload =
      Object.keys(details).length > 0 ? details : undefined;
    await onSubmit({ contractId, details: detailsPayload });
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
              onChange={(e) => {
                const nextId = e.target.value;
                setContractId(nextId);
                applyContractPrefill(nextId);
              }}
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
        {hasSchemaPrefill ? (
          <p className="text-caption text-fg-secondary">
            {t('business_service_order_schema_prefill_hint')}
          </p>
        ) : null}
        <ObjectBuilder
          key={detailsBuilderKey}
          value={details}
          label={t('business_service_order_details_label')}
          disabled={isBusy}
          onChange={(next, valid) => {
            setDetails(next);
            setDetailsValid(valid);
          }}
        />
      </div>
    </ModalShell>
  );
}
