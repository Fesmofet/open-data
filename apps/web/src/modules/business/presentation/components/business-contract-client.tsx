'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { businessRoutes } from '../../domain/routes';
import type { OblContractApiRow } from '../../infrastructure/clients/obl-ledger.server';
import { BusinessPageShell } from '../layout/business-page-shell';

export function BusinessContractClient({ contract }: { contract: OblContractApiRow }) {
  const { t, locale } = useI18n();
  const hasMetadata = Object.keys(contract.metadata ?? {}).length > 0;
  const offerName = contract.offer_name?.trim() || null;
  const offerDescription = contract.offer_description?.trim() || null;

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={offerName ?? contract.contract_id}
      subtitle={t('business_contract_subtitle')}
    >
      <dl className="grid gap-3 text-body-sm">
        {offerName ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_name')}</dt>
            <dd>{offerName}</dd>
          </div>
        ) : null}
        {offerDescription ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_description')}</dt>
            <dd className="whitespace-pre-wrap">{offerDescription}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-fg-secondary">{t('business_field_offer')}</dt>
          <dd>
            <Link
              href={businessRoutes.offerDetail(contract.offer_id)}
              className="text-link"
            >
              {contract.offer_id} v{contract.offer_version}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_contract')}</dt>
          <dd className="font-mono text-caption">{contract.contract_id}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_provider')}</dt>
          <dd>@{contract.provider}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_client')}</dt>
          <dd>@{contract.client}</dd>
        </div>
        <div>
          <dt className="text-fg-secondary">{t('business_field_dispute_rule')}</dt>
          <dd>{contract.dispute_rule}</dd>
        </div>
        {contract.arbiter ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_arbiter')}</dt>
            <dd>
              <Link
                href={businessRoutes.relationship(contract.arbiter)}
                className="text-link"
              >
                @{contract.arbiter}
              </Link>
            </dd>
          </div>
        ) : null}
        {contract.created_at ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
            <dd>
              <time dateTime={contract.created_at}>
                {formatAbsoluteDateTime(contract.created_at, locale)}
              </time>
            </dd>
          </div>
        ) : null}
        {contract.transaction_id ? (
          <div>
            <dt className="text-fg-secondary">{t('business_field_transaction_id')}</dt>
            <dd className="font-mono text-caption break-all">{contract.transaction_id}</dd>
          </div>
        ) : null}
        {hasMetadata ? (
          <div>
            <dt className="text-fg-secondary">{t('business_sign_metadata_label')}</dt>
            <dd>
              <pre className="mt-1 whitespace-pre-wrap rounded-btn border border-border bg-surface-alt p-2 font-mono text-caption">
                {JSON.stringify(contract.metadata, null, 2)}
              </pre>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={businessRoutes.relationship(contract.client)}
          className="text-body-sm text-link"
        >
          @{contract.client}
        </Link>
        <Link
          href={businessRoutes.relationship(contract.provider)}
          className="text-body-sm text-link"
        >
          @{contract.provider}
        </Link>
        {contract.arbiter ? (
          <Link
            href={businessRoutes.relationship(contract.arbiter)}
            className="text-body-sm text-link"
          >
            @{contract.arbiter}
          </Link>
        ) : null}
      </div>
    </BusinessPageShell>
  );
}
