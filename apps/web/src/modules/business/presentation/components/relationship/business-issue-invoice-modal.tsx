'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import type { LedgerContractRow } from '../../../domain/ledger.types';
import { shortContractId } from '../../../domain/dispute-resolution';
import { parseMetadataJson } from '../../../domain/offer-terms';
import {
  AccountPairSwapRow,
  RelationshipReadonlyField,
  parsePositiveUsdAmount,
} from './relationship-modal-fields';

export type BusinessIssueInvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  isBusy: boolean;
  issuer: string;
  debtor: string;
  creditor: string;
  contracts: LedgerContractRow[];
  onSubmit: (
    amountUsd: string,
    parties: { debtor: string; creditor: string },
    contractId?: string,
    details?: Record<string, unknown>,
  ) => Promise<void>;
};

export function BusinessIssueInvoiceModal({
  open,
  onClose,
  isBusy,
  issuer,
  debtor,
  creditor,
  contracts,
  onSubmit,
}: BusinessIssueInvoiceModalProps) {
  const { t } = useI18n();
  const titleId = 'business-issue-invoice-modal-title';
  const [amount, setAmount] = useState('10');
  const [detailsJson, setDetailsJson] = useState('');
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [contractId, setContractId] = useState('');
  const [parties, setParties] = useState({ debtor, creditor });

  useEffect(() => {
    if (open) {
      setParties({ debtor, creditor });
      setContractId(contracts[0]?.contract_id ?? '');
    }
  }, [open, debtor, creditor, contracts]);

  function onDetailsChange(value: string) {
    setDetailsJson(value);
    if (value.trim().length === 0) {
      setDetailsError(null);
      return;
    }
    setDetailsError(
      parseMetadataJson(value) === null ? t('business_invoice_details_invalid_json') : null,
    );
  }

  const canSubmit =
    !isBusy && parsePositiveUsdAmount(amount) && detailsError === null;

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
    await onSubmit(amount, parties, contractId || undefined, details);
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
            {t('business_modal_issue_invoice_title')}
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
            onClick={() => void handleSubmit()}
            className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          >
            {t('business_create_invoice')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <RelationshipReadonlyField label={t('business_field_issuer')} value={`@${issuer}`} />
        <AccountPairSwapRow
          leftLabel={t('business_field_debtor')}
          rightLabel={t('business_field_creditor')}
          leftValue={`@${parties.debtor}`}
          rightValue={`@${parties.creditor}`}
          swapAriaLabel={t('business_invoice_swap_debtor_creditor')}
          disabled={isBusy}
          onSwap={() =>
            setParties((current) => ({
              debtor: current.creditor,
              creditor: current.debtor,
            }))
          }
        />
        {contracts.length > 0 ? (
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
        ) : (
          <p className="text-caption text-fg-secondary">{t('business_field_no_contract')}</p>
        )}
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_field_amount_usd')}
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-btn border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-body-sm">
          {t('business_invoice_details_label')}
          <textarea
            value={detailsJson}
            onChange={(e) => onDetailsChange(e.target.value)}
            rows={4}
            className="rounded-btn border border-border px-3 py-2 font-mono text-caption"
            placeholder='{"report":"https://…","memo":"Work completed"}'
          />
          {detailsError ? <span className="text-caption text-error">{detailsError}</span> : null}
        </label>
      </div>
    </ModalShell>
  );
}
