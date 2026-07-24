'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { shortContractId } from '../../domain/dispute-resolution';
import { businessRoutes } from '../../domain/routes';
import type { OblServiceOrderDetailApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { BusinessPageShell } from '../layout/business-page-shell';

export function BusinessServiceOrderClient({
  detail,
}: {
  detail: OblServiceOrderDetailApiResponse;
}) {
  const { t, locale } = useI18n();
  const { serviceOrder, contract } = detail;

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={serviceOrder.service_order_id}
      subtitle={t('business_service_order_subtitle')}
    >
      <dl className="grid gap-3 text-body-sm">
        <div>
          <dt className="text-fg-secondary">{t('business_field_creator')}</dt>
          <dd>@{serviceOrder.creator}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_provider')}</dt>
          <dd>@{serviceOrder.provider}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_client')}</dt>
          <dd>@{serviceOrder.client}</dd>
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
        ) : (
          <div>
            <dt className="text-fg-secondary">{t('business_field_contract')}</dt>
            <dd className="font-mono text-caption">{serviceOrder.contract_id}</dd>
          </div>
        )}
        <div>
          <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
          <dd>
            <time dateTime={serviceOrder.created_at}>
              {formatAbsoluteDateTime(serviceOrder.created_at, locale)}
            </time>
          </dd>
        </div>
        {Object.keys(serviceOrder.details ?? {}).length > 0 ? (
          <div>
            <dt className="text-fg-secondary">{t('business_sign_metadata_label')}</dt>
            <dd>
              <pre className="mt-1 whitespace-pre-wrap rounded-btn border border-border bg-surface-alt p-2 font-mono text-caption">
                {JSON.stringify(serviceOrder.details, null, 2)}
              </pre>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={businessRoutes.relationship(serviceOrder.provider)}
          className="text-body-sm text-link"
        >
          @{serviceOrder.provider}
        </Link>
        <Link
          href={businessRoutes.relationship(serviceOrder.client)}
          className="text-body-sm text-link"
        >
          @{serviceOrder.client}
        </Link>
      </div>
    </BusinessPageShell>
  );
}
