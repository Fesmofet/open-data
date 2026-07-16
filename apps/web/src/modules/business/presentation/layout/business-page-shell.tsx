'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { OptimisticNavLink } from '@/shared/presentation';

import { businessRoutes, type BusinessNavId } from '../../domain/routes';

const NAV_ITEMS: { id: BusinessNavId; href: string; labelKey: string }[] = [
  { id: 'overview', href: businessRoutes.overview, labelKey: 'business_nav_overview' },
  { id: 'offers', href: businessRoutes.offers, labelKey: 'business_nav_offers' },
  {
    id: 'relationships',
    href: businessRoutes.relationships,
    labelKey: 'business_nav_relationships',
  },
];

export type BusinessLayoutNavProps = {
  active: BusinessNavId;
};

export function BusinessLayoutNav({ active }: BusinessLayoutNavProps) {
  const { t } = useI18n();

  return (
    <nav
      className="flex flex-col gap-1 border-b border-border pb-4 lg:border-b-0 lg:border-e lg:pb-0 lg:pe-6"
      aria-label={t('business_nav_aria')}
      suppressHydrationWarning
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <OptimisticNavLink
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            suppressHydrationWarning
            className={[
              'rounded-btn px-3 py-2 text-body-sm',
              isActive
                ? 'bg-surface-alt font-weight-label text-heading'
                : 'text-fg-secondary hover:bg-ghost-surface hover:text-fg',
            ].join(' ')}
          >
            {t(item.labelKey)}
          </OptimisticNavLink>
        );
      })}
    </nav>
  );
}

export type BusinessPageShellProps = {
  activeNav: BusinessNavId;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function BusinessPageShell({
  activeNav,
  title,
  subtitle,
  actions,
  children,
}: BusinessPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-container-content px-gutter py-section-y">
      <div className="mb-section-y flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-section font-display font-weight-display text-heading">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-body text-fg-secondary">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="grid gap-section-y lg:grid-cols-[12rem_minmax(0,1fr)]">
        <BusinessLayoutNav active={activeNav} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export type BusinessEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function BusinessEmptyState({
  title,
  description,
  action,
}: BusinessEmptyStateProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-card-padding text-center shadow-card">
      <h2 className="text-body font-weight-strong text-heading">{title}</h2>
      <p className="mt-2 text-body-sm text-fg-secondary">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function BusinessComingSoon({ feature }: { feature: string }) {
  const { t } = useI18n();
  return (
    <BusinessEmptyState
      title={t('business_coming_soon_title')}
      description={`${t('business_coming_soon_body')} ${feature}`}
    />
  );
}
