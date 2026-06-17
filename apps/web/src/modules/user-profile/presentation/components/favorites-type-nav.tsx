'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatFavoritesTypeLabel } from './favorites-type-label';

export type FavoritesTypeNavProps = {
  accountName: string;
  types: readonly string[];
  /** Typed segment from URL; undefined on bare `/@name/favorites`. */
  activeType?: string;
};

export function FavoritesTypeNav({ accountName, types, activeType }: FavoritesTypeNavProps) {
  const { t } = useI18n();
  const basePath = `/@${accountName}/favorites`;
  const firstType = types[0];
  const resolvedActive =
    activeType != null && activeType.length > 0 ? activeType : firstType;

  if (types.length === 0) {
    return (
      <nav aria-label={t('favorites')} className="rounded-card border border-border bg-surface/60 p-card-padding">
        <p className="font-weight-label text-fg">{t('favorites')}</p>
        <p className="mt-2 text-body-sm text-muted">{t('favorites_types_empty')}</p>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t('favorites')}
      className="rounded-card border border-border bg-surface/60 p-card-padding"
    >
      <p className="mb-3 font-weight-label text-fg">{t('favorites')}</p>
      <ul className="flex flex-col gap-1">
        {types.map((type) => {
          const href = `${basePath}/${encodeURIComponent(type)}`;
          const isActive = type === resolvedActive;
          const isBareFirst =
            (activeType == null || activeType.length === 0) && type === firstType;
          return (
            <li key={type}>
              <Link
                href={href}
                suppressHydrationWarning
                className={[
                  'block rounded-btn px-2 py-1.5 text-body-sm underline-offset-2 hover:bg-surface-control hover:text-fg',
                  isActive ? 'font-weight-label text-fg bg-surface-control' : 'text-muted',
                ].join(' ')}
                aria-current={isActive ? (isBareFirst ? 'page' : 'true') : undefined}
              >
                {formatFavoritesTypeLabel(type)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
