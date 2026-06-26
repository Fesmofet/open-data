'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

export function WaivAdvancedReportGeneratedTab() {
  const { t } = useI18n();

  return (
    <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
      {t('generated_tab_coming_soon')}
    </p>
  );
}
