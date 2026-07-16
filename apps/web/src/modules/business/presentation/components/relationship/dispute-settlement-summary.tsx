'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatUsdDisplay } from '../../../domain/dispute-resolution';
import type { LedgerDisputeRow, LedgerInvoiceRow } from '../../../domain/ledger.types';

export type DisputeSettlementSummaryProps = {
  dispute: LedgerDisputeRow;
  invoice: LedgerInvoiceRow | undefined;
};

function SettlementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
      <dt>{label}</dt>
      <dd className="font-mono text-fg-primary">{value}</dd>
    </div>
  );
}

export function DisputeSettlementSummary({ dispute, invoice }: DisputeSettlementSummaryProps) {
  const { t } = useI18n();
  const originalUsd = invoice?.amount_usd;
  const proposedUsd = dispute.proposed_amount_usd;
  const finalUsd = dispute.final_amount_usd ?? invoice?.final_amount_usd ?? null;
  const isResolved = dispute.status === 'resolved';

  return (
    <dl className="mt-2 grid gap-1 text-caption text-fg-secondary">
      <SettlementRow
        label={t('business_field_original_amount')}
        value={originalUsd != null ? `$${formatUsdDisplay(originalUsd)}` : '—'}
      />
      <SettlementRow
        label={t('business_dispute_proposed_by').replace('@account', `@${dispute.disputant}`)}
        value={`$${formatUsdDisplay(proposedUsd)}`}
      />
      {isResolved && finalUsd != null ? (
        <>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
            <dt>{t('business_field_final_amount')}</dt>
            <dd className="font-mono font-weight-label text-heading">
              ${formatUsdDisplay(finalUsd)}
            </dd>
          </div>
          {dispute.resolver ? (
            <SettlementRow
              label={t('business_field_resolver')}
              value={`@${dispute.resolver}`}
            />
          ) : null}
        </>
      ) : (
        <p className="text-caption text-fg-tertiary">{t('business_dispute_awaiting_resolution')}</p>
      )}
    </dl>
  );
}
