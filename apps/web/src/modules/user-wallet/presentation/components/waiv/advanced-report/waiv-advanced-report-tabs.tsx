'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

type WaivAdvancedReportTabsProps = {
  basePath: string;
  activeTab: 'standard' | 'generate';
};

export function WaivAdvancedReportTabs({
  basePath,
  activeTab,
}: WaivAdvancedReportTabsProps) {
  const { t } = useI18n();

  return (
    <nav className="mb-4 flex gap-4 border-b border-border text-body-sm">
      <Link
        href={`${basePath}?tab=standard`}
        className={
          activeTab === 'standard'
            ? 'border-b-2 border-accent pb-2 font-weight-strong'
            : 'pb-2 text-link'
        }
        suppressHydrationWarning
      >
        {t('standard_tab')}
      </Link>
      <Link
        href={`${basePath}?tab=generate`}
        className={
          activeTab === 'generate'
            ? 'border-b-2 border-accent pb-2 font-weight-strong'
            : 'pb-2 text-link'
        }
        suppressHydrationWarning
      >
        {t('generated_tab')}
      </Link>
    </nav>
  );
}
