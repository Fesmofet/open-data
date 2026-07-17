'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { shortContractId } from '../../domain/dispute-resolution';
import type { LedgerInvoiceRow } from '../../domain/ledger.types';
import { businessRoutes } from '../../domain/routes';
import type { OblDisputeDetailApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { BusinessPageShell } from '../layout/business-page-shell';
import { DisputeSettlementSummary } from './relationship/dispute-settlement-summary';
import { StateBadge } from './state-badge';

export function BusinessDisputeClient({ detail }: { detail: OblDisputeDetailApiResponse }) {
  const { t, locale } = useI18n();
  const { dispute, invoice, contract } = detail;

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={dispute.dispute_id}
      subtitle={t('business_dispute_subtitle')}
    >
      <div className="mb-4">
        <StateBadge variant={dispute.status === 'open' ? 'disputed' : 'resolved'} />
      </div>
      <dl className="grid gap-3 text-body-sm">
        <div>
          <dt className="text-fg-secondary">{t('business_field_invoice')}</dt>
          <dd>
            <Link href={businessRoutes.invoice(invoice.invoice_id)} className="text-link">
              {invoice.invoice_id}
            </Link>
          </dd>
        </div>
        {contract ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_contract')}</dt>
            <dd>
              <Link href={businessRoutes.contract(contract.contract_id)} className="text-link">
                {contract.offer_name ?? contract.contract_id} ·{' '}
                {shortContractId(contract.contract_id)}
              </Link>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
          <dd>
            <time dateTime={dispute.created_at}>
              {formatAbsoluteDateTime(dispute.created_at, locale)}
            </time>
          </dd>
        </div>
      </dl>
      <DisputeSettlementSummary dispute={dispute} invoice={invoice as LedgerInvoiceRow} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={businessRoutes.relationship(invoice.debtor)}
          className="text-body-sm text-link"
        >
          @{invoice.debtor}
        </Link>
        <Link
          href={businessRoutes.relationship(invoice.creditor)}
          className="text-body-sm text-link"
        >
          @{invoice.creditor}
        </Link>
      </div>
    </BusinessPageShell>
  );
}
