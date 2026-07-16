'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { businessRoutes } from '../../domain/routes';
import type { OblContractApiRow } from '../../infrastructure/clients/obl-ledger.server';
import { BusinessPageShell } from '../layout/business-page-shell';

export function BusinessContractClient({ contract }: { contract: OblContractApiRow }) {
  const { t } = useI18n();

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={contract.contract_id}
      subtitle={t('business_contract_subtitle')}
    >
      <dl className="grid gap-3 text-body-sm">
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
        {Object.keys(contract.metadata ?? {}).length > 0 ? (
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
      <div className="mt-6 flex gap-3">
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
      </div>
    </BusinessPageShell>
  );
}
