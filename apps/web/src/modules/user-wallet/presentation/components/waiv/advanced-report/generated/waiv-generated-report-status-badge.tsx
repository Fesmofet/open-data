'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivGeneratedReportSummaryApi } from '../../../../../application/dto/waiv-generated-report-api.schema';

const STATUS_KEY: Record<string, string> = {
  pending: 'generated_report_status_pending',
  in_progress: 'generated_report_status_in_progress',
  completed: 'generated_report_status_completed',
  failed: 'generated_report_status_failed',
  stopped: 'generated_report_status_stopped',
};

export function WaivGeneratedReportStatusBadge({
  status,
}: {
  status: WaivGeneratedReportSummaryApi['status'];
}) {
  const { t } = useI18n();
  const key = STATUS_KEY[status] ?? 'generated_report_status_pending';
  return (
    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-caption text-muted">
      {t(key)}
    </span>
  );
}
