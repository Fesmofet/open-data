'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { shortContractId } from '../../domain/dispute-resolution';
import { businessRoutes } from '../../domain/routes';
import type { OblReportDetailApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { BusinessPageShell } from '../layout/business-page-shell';

export function BusinessReportClient({ detail }: { detail: OblReportDetailApiResponse }) {
  const { t, locale } = useI18n();
  const { report, contract } = detail;

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={report.report_id}
      subtitle={t('business_report_subtitle')}
    >
      <dl className="grid gap-3 text-body-sm">
        <div>
          <dt className="text-fg-secondary">{t('business_field_author')}</dt>
          <dd>@{report.author}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_provider')}</dt>
          <dd>@{report.provider}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_client')}</dt>
          <dd>@{report.client}</dd>
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
        ) : report.contract_id ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_contract')}</dt>
            <dd className="font-mono text-caption">{report.contract_id}</dd>
          </div>
        ) : null}
        {report.service_order_id ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_service_order')}</dt>
            <dd>
              <Link
                href={businessRoutes.serviceOrder(report.service_order_id)}
                className="text-link"
              >
                {report.service_order_id}
              </Link>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
          <dd>
            <time dateTime={report.created_at}>
              {formatAbsoluteDateTime(report.created_at, locale)}
            </time>
          </dd>
        </div>
        {Object.keys(report.details ?? {}).length > 0 ? (
          <div>
            <dt className="text-fg-secondary">{t('business_sign_metadata_label')}</dt>
            <dd>
              <pre className="mt-1 whitespace-pre-wrap rounded-btn border border-border bg-surface-alt p-2 font-mono text-caption">
                {JSON.stringify(report.details, null, 2)}
              </pre>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={businessRoutes.relationship(report.provider)} className="text-body-sm text-link">
          @{report.provider}
        </Link>
        <Link href={businessRoutes.relationship(report.client)} className="text-body-sm text-link">
          @{report.client}
        </Link>
      </div>
    </BusinessPageShell>
  );
}
