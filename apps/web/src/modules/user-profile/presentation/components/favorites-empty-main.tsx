'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export function FavoritesEmptyMain() {
  const { t } = useI18n();
  return (
    <section className="rounded-card border border-border bg-surface/80 p-card-padding">
      <h2 className="text-body-lg font-weight-strong font-display text-fg">{t('favorites')}</h2>
      <p className="mt-2 text-body-sm text-muted">{t('empty_favorites')}</p>
    </section>
  );
}
