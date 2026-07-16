'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { businessRoutes } from '../../domain/routes';
import {
  BusinessEmptyState,
  BusinessPageShell,
} from '../layout/business-page-shell';

export function BusinessOverviewClient({ username }: { username: string }) {
  const { t } = useI18n();

  return (
    <BusinessPageShell
      activeNav="overview"
      title={t('business_title')}
      subtitle={t('business_overview_subtitle')}
      actions={
        <Link
          href={businessRoutes.offersNew}
          className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg"
        >
          {t('business_create_offer_or_request')}
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-card-padding shadow-card">
          <h2 className="text-body font-weight-strong text-heading">
            {t('business_overview_discover_title')}
          </h2>
          <p className="mt-2 text-body-sm text-fg-secondary">
            {t('business_overview_discover_body')}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={businessRoutes.publicOffers}
              className="rounded-btn border border-border px-3 py-1.5 text-body-sm text-link"
            >
              {t('business_view_offers')}
            </Link>
            <Link
              href={businessRoutes.publicRequests}
              className="rounded-btn border border-border px-3 py-1.5 text-body-sm text-link"
            >
              {t('business_view_requests')}
            </Link>
            <Link
              href={businessRoutes.offers}
              className="rounded-btn border border-border px-3 py-1.5 text-body-sm text-link"
            >
              {t('business_manage_offers')}
            </Link>
          </div>
        </div>
        <BusinessEmptyState
          title={t('business_overview_activity_title')}
          description={t('business_overview_activity_body')}
        />
      </div>
      <p className="mt-4 text-caption text-fg-tertiary">
        {t('business_signed_in_as')} @{username}
      </p>
    </BusinessPageShell>
  );
}
