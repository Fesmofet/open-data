'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivAdvancedReportRowApi } from '../../../../../application/dto/waiv-advanced-report-api.schema';
import type { WaivGeneratedReportSummaryApi } from '../../../../../application/dto/waiv-generated-report-api.schema';
import {
  type WaivAdvancedReportRowView,
} from '../../../../../application/mappers/build-waiv-advanced-report-row-view';
import {
  getWaivGeneratedReportClient,
  stopWaivGeneratedReportClient,
  toggleWaivGeneratedReportRowClient,
} from '../../../../../infrastructure/clients/waiv-generated-report.browser.client';
import { loadWaivGeneratedReportRows } from '../../../../../application/queries/load-waiv-generated-report-rows';
import { formatAdvancedReportTotal } from '../../../hive/advanced-report/format-advanced-report-total';
import {
  WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL,
  waivAdvancedReportTableGridStyle,
} from '../waiv-advanced-report-table-layout';
import { WaivAdvancedReportVirtualTbody } from '../waiv-advanced-report-virtual-tbody';
import { unixToYmd } from '../waiv-advanced-report-filters';
import { downloadWaivGeneratedReportCsv } from './download-waiv-generated-report-csv';
import { WaivGeneratedReportAccountsSummary } from './waiv-generated-report-accounts-summary';
import { WaivGeneratedReportStatusBadge } from './waiv-generated-report-status-badge';
import {
  canExportWaivGeneratedReport,
  isWaivGeneratedReportRunning,
} from './waiv-generated-report-export';

const EXPORT_ACTION_CLASS =
  'text-link disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline';

const POLL_MS = 3_000;

type WaivGeneratedReportDetailProps = {
  basePath: string;
  reportId: string;
  viewerUsername: string | null;
};

export function WaivGeneratedReportDetail({
  basePath,
  reportId,
  viewerUsername,
}: WaivGeneratedReportDetailProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<WaivGeneratedReportSummaryApi | null>(null);
  const [wallet, setWallet] = useState<WaivAdvancedReportRowApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const walletLengthRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    walletLengthRef.current = wallet.length;
  }, [wallet.length]);

  const loadFull = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }
    refreshInFlightRef.current = true;
    setRefreshing(true);

    const meta = await getWaivGeneratedReportClient(reportId);
    if (!meta.ok) {
      setLoadError(true);
      setLoading(false);
      setRefreshing(false);
      refreshInFlightRef.current = false;
      return;
    }

    setSummary(meta.data);
    setWallet([]);
    walletLengthRef.current = 0;

    const rows = await loadWaivGeneratedReportRows(reportId, {
      startSkip: 0,
      onBatch: (_batch, accumulated) => {
        setWallet(accumulated);
        setLoading(false);
      },
    });

    if (rows === null) {
      setLoadError(true);
      setLoading(false);
      setRefreshing(false);
      refreshInFlightRef.current = false;
      return;
    }

    setWallet(rows);
    setLoadError(false);
    setLoading(false);
    setRefreshing(false);
    refreshInFlightRef.current = false;
  }, [reportId]);

  const pollIncremental = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }
    refreshInFlightRef.current = true;

    try {
      const meta = await getWaivGeneratedReportClient(reportId);
      if (!meta.ok) {
        return;
      }
      setSummary(meta.data);

      const knownLength = walletLengthRef.current;
      if (meta.data.rowCount <= knownLength) {
        return;
      }

      await loadWaivGeneratedReportRows(reportId, {
        startSkip: knownLength,
        onBatch: (batch) => {
          if (batch.length > 0) {
            setWallet((prev) => [...prev, ...batch]);
          }
        },
      });
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [reportId]);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    setSummary(null);
    setWallet([]);
    walletLengthRef.current = 0;
    void loadFull();
  }, [loadFull]);

  useEffect(() => {
    if (!summary || !isWaivGeneratedReportRunning(summary.status)) {
      return;
    }
    const timer = window.setInterval(() => {
      void pollIncremental();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [pollIncremental, summary?.status, summary]);

  const onToggleExemption = useCallback(
    (row: WaivAdvancedReportRowView, checked: boolean) => {
      if (!viewerUsername) {
        return;
      }
      setWallet((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.userName === row.userName && item.operationIndex === row.operationIndex,
        );
        if (index < 0) {
          return prev;
        }
        const next = prev.slice();
        next[index] = { ...next[index]!, checked };
        return next;
      });
      void toggleWaivGeneratedReportRowClient(reportId, row.operationIndex, checked).then(
        (result) => {
          if (result.ok) {
            setSummary(result.data);
          }
        },
      );
    },
    [reportId, viewerUsername],
  );

  const onStop = useCallback(async () => {
    const result = await stopWaivGeneratedReportClient(reportId);
    if (result.ok) {
      setSummary(result.data);
      void loadFull();
    }
  }, [reportId, loadFull]);

  const onExportCsv = useCallback(async () => {
    if (!summary || !canExportWaivGeneratedReport(summary.status, wallet.length)) {
      return;
    }
    setExportingCsv(true);
    try {
      await downloadWaivGeneratedReportCsv(reportId);
    } finally {
      setExportingCsv(false);
    }
  }, [reportId, summary, wallet.length]);

  if (loading && !summary) {
    return <p className="text-body-sm text-muted">{t('activity_loading')}</p>;
  }
  if (loadError || !summary) {
    return <p className="text-body-sm text-danger">{t('unavailable')}</p>;
  }

  const isRunning = isWaivGeneratedReportRunning(summary.status);
  const exportDisabled =
    loading ||
    refreshing ||
    exportingCsv ||
    isRunning ||
    !canExportWaivGeneratedReport(summary.status, wallet.length);
  const statusLabel = isRunning
    ? t('generated_report_generating').replace('{count}', String(summary.rowCount))
    : t('advanced_report_completed_count').replace('{count}', String(summary.rowCount));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`${basePath}?tab=generate`} className="text-link text-body-sm">
          {t('generated_report_back_to_list')}
        </Link>
        <WaivGeneratedReportStatusBadge status={summary.status} />
      </div>

      <div className="space-y-2 text-body-sm">
        <div>
          <span className="font-weight-strong">{t('generated_report_accounts')}: </span>
          <WaivGeneratedReportAccountsSummary accounts={summary.filterAccounts} />
        </div>
        <p className="text-muted">
          {t('table_date_from')}: {unixToYmd(summary.startDateTs)} · {t('table_date_till')}:{' '}
          {unixToYmd(summary.endDateTs)} · {summary.currency}
        </p>
      </div>

      <p className="text-body-sm">
        <span className="font-weight-strong">{t('total')}</span>: {t('Deposits')}:{' '}
        <span className="font-weight-strong tabular-nums">
          {formatAdvancedReportTotal(summary.deposits, summary.currency)}
        </span>
        . {t('Withdrawals')}:{' '}
        <span className="font-weight-strong tabular-nums">
          {formatAdvancedReportTotal(summary.withdrawals, summary.currency)}
        </span>
        . ({statusLabel}){' '}
        <span className="ml-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            className={EXPORT_ACTION_CLASS}
            disabled={exportDisabled}
            aria-disabled={exportDisabled}
            onClick={() => void onExportCsv()}
          >
            {exportingCsv ? t('advanced_report_exporting') : t('advanced_report_export_csv')}
          </button>
          {isRunning ? (
            <button type="button" className="text-link" onClick={() => void onStop()}>
              {t('generated_report_stop')}
            </button>
          ) : null}
        </span>
      </p>

      <div
        ref={scrollRef}
        className="scrollbar-hide max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-16rem)] w-full overflow-auto rounded-card border border-border"
      >
        <div
          role="table"
          className="w-full min-w-[720px] text-left text-body-sm"
        >
          <div
            role="rowgroup"
            className="sticky top-0 z-10 border-b border-border bg-surface-control shadow-[inset_0_-1px_0_var(--color-border)]"
          >
            <div role="row" style={waivAdvancedReportTableGridStyle}>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                X
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                {t('table_date')}
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                WAIV
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                WP
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                {`WAIV/${summary.currency}`}
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                ±
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                {t('account')}
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                {t('table_description')}
              </div>
              <div role="columnheader" className={WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL}>
                {t('memo')}
              </div>
            </div>
          </div>
          <WaivAdvancedReportVirtualTbody
            wallet={wallet}
            scrollRef={scrollRef}
            canToggleExemption={Boolean(viewerUsername?.trim())}
            onToggleExemption={onToggleExemption}
          />
        </div>
      </div>
    </div>
  );
}
