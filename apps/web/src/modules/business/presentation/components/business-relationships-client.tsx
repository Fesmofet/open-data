'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { businessRoutes } from '../../domain/routes';
import type { OblRelationshipApiRow } from '../../infrastructure/clients/obl-ledger.server';
import { DirectionalUsd } from './directional-usd';
import {
  BusinessEmptyState,
  BusinessPageShell,
} from '../layout/business-page-shell';

export function BusinessRelationshipsClient({
  username,
  rows,
}: {
  username: string;
  rows: OblRelationshipApiRow[];
}) {
  const { t } = useI18n();

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={t('business_relationships_title')}
      subtitle={t('business_relationships_subtitle')}
    >
      {rows.length === 0 ? (
        <BusinessEmptyState
          title={t('business_relationships_empty_title')}
          description={t('business_relationships_empty_body')}
          action={
            <Link
              href={businessRoutes.publicOffers}
              className="rounded-btn bg-accent px-4 py-2 text-body-sm text-accent-fg"
            >
              {t('business_view_offers')}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.counterparty}
              className="rounded-card border border-border bg-surface p-card-padding shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-body font-weight-strong text-heading">
                    @{row.counterparty}
                  </p>
                  <p className="text-caption text-fg-secondary">
                    {row.roles.join(', ')} · {row.contractCount}{' '}
                    {t('business_contracts')}
                  </p>
                  <DirectionalUsd
                    viewer={username}
                    counterparty={row.counterparty}
                    accountA={row.balance.accountA}
                    accountB={row.balance.accountB}
                    bucket={row.balance.confirmed}
                  />
                </div>
                <Link
                  href={businessRoutes.relationship(row.counterparty)}
                  className="rounded-btn border border-border px-3 py-1 text-body-sm text-link"
                >
                  {t('business_open')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BusinessPageShell>
  );
}
