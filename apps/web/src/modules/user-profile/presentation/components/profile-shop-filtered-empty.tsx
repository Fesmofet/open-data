'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export function ProfileShopFilteredEmpty() {
  const { t } = useI18n();
  return (
    <section
      className="rounded-card border border-border bg-surface/80 p-card-padding"
      aria-labelledby="shop-filter-empty"
    >
      <p id="shop-filter-empty" className="text-body-sm text-muted">
        {t('profile_no_shop_for_filters')}
      </p>
    </section>
  );
}
