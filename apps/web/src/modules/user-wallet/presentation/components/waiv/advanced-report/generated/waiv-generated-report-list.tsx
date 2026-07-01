'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivGeneratedReportSummaryApi } from '../../../../../application/dto/waiv-generated-report-api.schema';
import {
  deleteWaivGeneratedReportClient,
  listWaivGeneratedReportsClient,
} from '../../../../../infrastructure/clients/waiv-generated-report.browser.client';
import { formatAdvancedReportTotal } from '../../../hive/advanced-report/format-advanced-report-total';
import { unixToYmd } from '../waiv-advanced-report-filters';
import { downloadWaivGeneratedReportCsv } from './download-waiv-generated-report-csv';
import { formatGeneratedReportAccounts } from './format-generated-report-accounts';
import { WaivGeneratedReportDeleteConfirmModal } from './waiv-generated-report-delete-confirm-modal';
import { canExportWaivGeneratedReport } from './waiv-generated-report-export';
import { WaivGeneratedReportStatusBadge } from './waiv-generated-report-status-badge';

const EXPORT_ACTION_CLASS =
  'text-link disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline';

type WaivGeneratedReportListProps = {
  basePath: string;
  activeReportId?: string | null;
  refreshToken?: number;
};

export function WaivGeneratedReportList({
  basePath,
  activeReportId,
  refreshToken = 0,
}: WaivGeneratedReportListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [reports, setReports] = useState<WaivGeneratedReportSummaryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [exportErrorReportId, setExportErrorReportId] = useState<string | null>(null);
  const [pendingDeleteReportId, setPendingDeleteReportId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const result = await listWaivGeneratedReportsClient({ limit: 50 });
    if (!result.ok) {
      setError(true);
      setReports([]);
    } else {
      setReports(result.data.reports);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const onExportCsv = useCallback(async (reportId: string) => {
    setExportErrorReportId(null);
    setExportingReportId(reportId);
    try {
      const result = await downloadWaivGeneratedReportCsv(reportId);
      if (result !== 'ok') {
        setExportErrorReportId(reportId);
      }
    } finally {
      setExportingReportId(null);
    }
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDeleteReportId) {
      return;
    }
    setDeleting(true);
    setDeleteError(false);
    const reportId = pendingDeleteReportId;
    const result = await deleteWaivGeneratedReportClient(reportId);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(true);
      return;
    }
    setPendingDeleteReportId(null);
    if (activeReportId === reportId) {
      router.push(`${basePath}?tab=generate`);
    }
    await load();
  }, [activeReportId, basePath, load, pendingDeleteReportId, router]);

  if (loading) {
    return <p className="text-body-sm text-muted">{t('activity_loading')}</p>;
  }
  if (error) {
    return <p className="text-body-sm text-danger">{t('unavailable')}</p>;
  }
  if (reports.length === 0) {
    return (
      <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
        {t('generated_report_empty_list')}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[760px] text-body-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3">{t('table_date_from')}</th>
              <th className="p-3">{t('table_date_till')}</th>
              <th className="p-3">{t('generated_report_accounts')}</th>
              <th className="p-3">{t('status')}</th>
              <th className="p-3">{t('Deposits')}</th>
              <th className="p-3">{t('Withdrawals')}</th>
              <th className="p-3">{t('generated_report_rows')}</th>
              <th className="p-3" aria-label={t('details')} />
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const href = `${basePath}?tab=generate&reportId=${encodeURIComponent(report.id)}`;
              const isActive = activeReportId === report.id;
              const isExporting = exportingReportId === report.id;
              const exportFailed = exportErrorReportId === report.id;
              const exportDisabled =
                isExporting ||
                !canExportWaivGeneratedReport(report.status, report.rowCount);
              return (
                <tr
                  key={report.id}
                  className={isActive ? 'bg-accent/5' : 'hover:bg-muted/5'}
                >
                  <td className="p-3 tabular-nums">{unixToYmd(report.startDateTs)}</td>
                  <td className="p-3 tabular-nums">{unixToYmd(report.endDateTs)}</td>
                  <td
                    className="max-w-[14rem] truncate p-3"
                    title={formatGeneratedReportAccounts(report.filterAccounts)}
                  >
                    {formatGeneratedReportAccounts(report.filterAccounts)}
                  </td>
                  <td className="p-3">
                    <WaivGeneratedReportStatusBadge status={report.status} />
                  </td>
                  <td className="p-3">
                    {formatAdvancedReportTotal(report.deposits, report.currency)}
                  </td>
                  <td className="p-3">
                    {formatAdvancedReportTotal(report.withdrawals, report.currency)}
                  </td>
                  <td className="p-3">{report.rowCount}</td>
                  <td className="p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col items-start gap-1 whitespace-nowrap">
                        <Link href={href} className="text-link">
                          {t('details')}
                        </Link>
                        <button
                          type="button"
                          className={EXPORT_ACTION_CLASS}
                          disabled={exportDisabled}
                          aria-disabled={exportDisabled}
                          onClick={() => void onExportCsv(report.id)}
                        >
                          {isExporting
                            ? t('advanced_report_exporting')
                            : t('advanced_report_export_csv')}
                        </button>
                        {exportFailed ? (
                          <span className="text-danger">{t('unavailable')}</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="text-link text-danger disabled:opacity-50"
                        onClick={() => {
                          setDeleteError(false);
                          setPendingDeleteReportId(report.id);
                        }}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <WaivGeneratedReportDeleteConfirmModal
        open={pendingDeleteReportId !== null}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setPendingDeleteReportId(null);
            setDeleteError(false);
          }
        }}
        onConfirm={() => void onConfirmDelete()}
      />
      {deleteError ? (
        <p className="mt-2 text-body-sm text-danger" role="alert">
          {t('unavailable')}
        </p>
      ) : null}
    </>
  );
}
