'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivGeneratedReportSummaryApi } from '../../../../application/dto/waiv-generated-report-api.schema';
import { WaivGeneratedReportDetail } from './generated/waiv-generated-report-detail';
import { WaivGeneratedReportGenerateForm } from './generated/waiv-generated-report-generate-form';
import { WaivGeneratedReportList } from './generated/waiv-generated-report-list';

type WaivAdvancedReportGeneratedTabProps = {
  basePath: string;
  profileAccount: string;
  viewerUsername: string | null;
  reportId?: string | null;
};

export function WaivAdvancedReportGeneratedTab({
  basePath,
  profileAccount,
  viewerUsername,
  reportId,
}: WaivAdvancedReportGeneratedTabProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [listRefresh, setListRefresh] = useState(0);

  const onCreated = useCallback(
    (report: WaivGeneratedReportSummaryApi) => {
      setListRefresh((value) => value + 1);
      router.push(`${basePath}?tab=generate&reportId=${encodeURIComponent(report.id)}`);
    },
    [basePath, router],
  );

  if (!viewerUsername?.trim()) {
    return (
      <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
        {t('advanced_report_unauthorized')}
      </p>
    );
  }

  if (reportId) {
    return (
      <WaivGeneratedReportDetail
        basePath={basePath}
        reportId={reportId}
        viewerUsername={viewerUsername}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WaivGeneratedReportGenerateForm
        profileAccount={profileAccount}
        onCreated={onCreated}
      />
      <WaivGeneratedReportList
        basePath={basePath}
        refreshToken={listRefresh}
      />
    </div>
  );
}
