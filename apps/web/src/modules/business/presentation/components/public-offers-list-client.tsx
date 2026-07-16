'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  buildPublicOffersHref,
  hasPublicOffersFilters,
  type PublicOffersPageState,
} from '../../domain/public-offers-url';
import { businessRoutes } from '../../domain/routes';
import type { OblOfferApiRow } from '../../infrastructure/clients/obl-offers.server';
import { PublicOffersFilters } from './public-offers-filters';
import { StateBadge } from './state-badge';
import { BusinessPageShell } from '../layout/business-page-shell';

export function PublicOffersListClient({
  offers,
  kind,
  filters,
}: {
  offers: OblOfferApiRow[];
  kind: 'offer' | 'request';
  filters: PublicOffersPageState;
}) {
  const { t } = useI18n();
  const title = t('business_title');
  const subtitle = t('business_discover_subtitle');
  const hasFilters = hasPublicOffersFilters(filters);
  const filterHint =
    filters.author && filters.q
      ? `@${filters.author} · "${filters.q}"`
      : filters.author
        ? `@${filters.author}`
        : filters.q
          ? `"${filters.q}"`
          : null;
  const tabQuery = {
    author: filters.author || undefined,
    q: filters.q || undefined,
  };

  return (
    <BusinessPageShell activeNav="discover" title={title} subtitle={subtitle}>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['offer', 'request'] as const).map((id) => (
          <Link
            key={id}
            href={buildPublicOffersHref(id, tabQuery)}
            className={[
              'rounded-pill border px-3 py-1 text-body-sm',
              kind === id
                ? 'border-border bg-surface-alt font-weight-label text-heading'
                : 'border-transparent text-fg-secondary',
            ].join(' ')}
          >
            {id === 'offer'
              ? t('business_public_offers_title')
              : t('business_public_requests_title')}
          </Link>
        ))}
      </div>

      {filterHint ? (
        <p className="mb-4 text-caption text-fg-tertiary">{filterHint}</p>
      ) : null}

      <PublicOffersFilters kind={kind} filters={filters} />

      {offers.length === 0 && hasFilters ? (
        <p className="text-body text-fg-secondary">
          {kind === 'offer'
            ? t('business_public_offers_empty_filtered')
            : t('business_public_requests_empty_filtered')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {offers.map((offer) => {
            const href =
              kind === 'offer'
                ? businessRoutes.publicOffer(offer.offer_id, offer.version)
                : businessRoutes.publicRequest(offer.offer_id, offer.version);
            return (
              <li
                key={`${offer.offer_id}-${offer.version}`}
                className="rounded-card border border-border bg-surface p-card-padding shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-body font-weight-strong text-heading">
                      {offer.name}
                    </p>
                    <p className="text-caption text-fg-secondary">
                      @{offer.author} · v{offer.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StateBadge variant="confirmed" />
                    <Link
                      href={href}
                      className="rounded-btn border border-border px-3 py-1 text-body-sm text-link"
                    >
                      {t('business_view')}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </BusinessPageShell>
  );
}
