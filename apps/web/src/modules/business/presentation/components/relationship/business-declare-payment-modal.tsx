'use client';

import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ModalShell, ModalShellCloseButton } from '@/shared/presentation';

import { ObjectBuilder } from '../object-builder';
import {
  AccountPairSwapRow,
  parsePositiveUsdAmount,
} from './relationship-modal-fields';

export type BusinessDeclarePaymentModalProps = {
  open: boolean;
  onClose: () => void;
  isBusy: boolean;
  viewer: string;
  payer: string;
  receiver: string;
  onSubmit: (
    amountUsd: string,
    parties: { payer: string; receiver: string },
    ref?: Record<string, unknown>,
  ) => Promise<void>;
};

export function BusinessDeclarePaymentModal({
  open,
  onClose,
  isBusy,
  viewer,
  payer,
  receiver,
  onSubmit,
}: BusinessDeclarePaymentModalProps) {
  const { t } = useI18n();
  const titleId = 'business-declare-payment-modal-title';
  const [amount, setAmount] = useState('5');
  const [ref, setRef] = useState<Record<string, unknown>>({});
  const [refValid, setRefValid] = useState(true);
  const [refBuilderKey, setRefBuilderKey] = useState(0);
  const [parties, setParties] = useState({ payer, receiver });

  useEffect(() => {
    if (open) {
      setParties({ payer, receiver });
      setRef({});
      setRefValid(true);
      setRefBuilderKey((key) => key + 1);
    }
  }, [open, payer, receiver]);

  const isReceiverConfirm = parties.receiver === viewer;

  const canSubmit = !isBusy && parsePositiveUsdAmount(amount) && refValid;

  async function handleSubmit() {
    const refPayload = Object.keys(ref).length > 0 ? ref : undefined;
    await onSubmit(amount, parties, refPayload);
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
            {t('business_modal_record_payment_title')}
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
            {isReceiverConfirm
              ? t('business_confirm_received_payment')
              : t('business_record_payment')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-card-padding">
        <AccountPairSwapRow
          leftLabel={t('business_field_payer')}
          rightLabel={t('business_field_receiver')}
          leftValue={`@${parties.payer}`}
          rightValue={`@${parties.receiver}`}
          swapAriaLabel={t('business_payment_swap_payer_receiver')}
          disabled={isBusy}
          onSwap={() =>
            setParties((current) => ({
              payer: current.receiver,
              receiver: current.payer,
            }))
          }
        />
        {isReceiverConfirm ? (
          <aside
            className="rounded-card border border-border bg-surface-alt p-card-padding text-body-sm text-fg-secondary"
            role="alert"
          >
            {t('business_payment_receiver_confirm_warning').replace(
              '{account}',
              `@${parties.payer}`,
            )}
          </aside>
        ) : null}
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
        <ObjectBuilder
          key={refBuilderKey}
          value={{}}
          label={t('business_payment_ref_label')}
          disabled={isBusy}
          onChange={(next, valid) => {
            setRef(next);
            setRefValid(valid);
          }}
        />
      </div>
    </ModalShell>
  );
}
