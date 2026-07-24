'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { formatUsdDisplay, shortContractId } from '../../domain/dispute-resolution';
import { businessRoutes } from '../../domain/routes';
import type { OblInvoiceDetailApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { InvoiceObligationLinesTable } from './relationship/invoice-obligation-lines-table';
import { BusinessPageShell } from '../layout/business-page-shell';
import { StateBadge } from './state-badge';

function invoiceStateBadgeVariant(
  state: string,
): 'confirmed' | 'pending_signature' | 'disputed' | 'resolved' {
  if (state === 'pending') {
    return 'pending_signature';
  }
  if (state === 'disputed') {
    return 'disputed';
  }
  if (state === 'resolved') {
    return 'resolved';
  }
  return 'confirmed';
}

export function BusinessInvoiceClient({ detail }: { detail: OblInvoiceDetailApiResponse }) {
  const { t, locale } = useI18n();
  const { invoice, contract, serviceOrder, report } = detail;
  const lines = invoice.lines ?? [];
  const isMulti = (invoice.kind === 'multi' || lines.length > 1);
  const showSettled =
    invoice.state === 'resolved' &&
    invoice.final_amount_usd != null &&
    invoice.final_amount_usd !== '';

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={invoice.invoice_id}
      subtitle={t('business_invoice_subtitle')}
    >
      <div className="mb-4">
        <StateBadge variant={invoiceStateBadgeVariant(invoice.state)} />
      </div>
      <dl className="grid gap-3 text-body-sm">
        <div>
          <dt className="text-fg-secondary">{t('business_field_issuer')}</dt>
          <dd>@{invoice.issuer}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_debtor')}</dt>
          <dd>@{invoice.debtor}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_creditor')}</dt>
          <dd>@{invoice.creditor}</dd>
        </div>
        {isMulti ? (
          <div className="sm:col-span-2">
            <dt className="mb-2 text-fg-secondary">{t('business_invoice_beneficiaries')}</dt>
            <dd>
              <InvoiceObligationLinesTable lines={lines} totalUsd={invoice.amount_usd} />
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-fg-secondary">{t('business_field_amount_usd')}</dt>
          <dd>
            {showSettled ? (
              <>
                ${formatUsdDisplay(invoice.amount_usd)} → $
                {formatUsdDisplay(invoice.final_amount_usd)}
              </>
            ) : (
              <>${formatUsdDisplay(invoice.amount_usd)}</>
            )}
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
        {serviceOrder ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_service_order')}</dt>
            <dd>
              <Link
                href={businessRoutes.serviceOrder(serviceOrder.service_order_id)}
                className="text-link"
              >
                {serviceOrder.service_order_id}
              </Link>
            </dd>
          </div>
        ) : invoice.service_order_id ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_service_order')}</dt>
            <dd className="font-mono text-caption">{invoice.service_order_id}</dd>
          </div>
        ) : null}
        {report ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_report')}</dt>
            <dd>
              <Link href={businessRoutes.report(report.report_id)} className="text-link">
                {report.report_id}
              </Link>
            </dd>
          </div>
        ) : invoice.report_id ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_report')}</dt>
            <dd className="font-mono text-caption">{invoice.report_id}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
          <dd>
            <time dateTime={invoice.created_at}>
              {formatAbsoluteDateTime(invoice.created_at, locale)}
            </time>
          </dd>
        </div>
        {Object.keys(invoice.details ?? {}).length > 0 ? (
          <div>
            <dt className="text-fg-secondary">{t('business_sign_metadata_label')}</dt>
            <dd>
              <pre className="mt-1 whitespace-pre-wrap rounded-btn border border-border bg-surface-alt p-2 font-mono text-caption">
                {JSON.stringify(invoice.details, null, 2)}
              </pre>
            </dd>
          </div>
        ) : null}
      </dl>
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
        {invoice.state === 'disputed' ? (
          <Link
            href={businessRoutes.relationshipTab(invoice.debtor, 'disputes')}
            className="text-body-sm text-link"
          >
            {t('business_tab_disputes')}
          </Link>
        ) : null}
      </div>
    </BusinessPageShell>
  );
}
