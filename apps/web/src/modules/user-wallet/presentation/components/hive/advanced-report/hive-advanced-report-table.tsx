'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SupportedCurrency } from '@opden-data-layer/core/constants';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { HiveAdvancedReportRequest } from '../../../../application/dto/hive-advanced-report-api.schema';
import type {
  AdvancedReportRowApi,
  HiveAdvancedReportQueryResult,
  HiveAdvancedReportResponseApi,
} from '../../../../application/dto/hive-advanced-report-api.schema';
import {
  buildAdvancedReportRowView,
  type AdvancedReportRowView,
} from '../../../../application/mappers/build-advanced-report-row-view';
import { loadFullHiveAdvancedReport } from '../../../../application/queries/load-full-hive-advanced-report';
import { totalsFromAdvancedReportWallet } from '../../../../application/queries/load-full-hive-advanced-report.helpers';
import { loadProgressiveHiveAdvancedReport } from '../../../../application/queries/load-progressive-hive-advanced-report';
import { postHiveWalletExemptionClient } from '../../../../infrastructure/clients/hive-advanced-report.browser.client';
import {
  HiveAdvancedReportFilters,
  unixToYmd,
  ymdToUnixEnd,
  ymdToUnixStart,
  type AdvancedReportFiltersState,
} from './hive-advanced-report-filters';
import { buildAdvancedReportCsv } from './hive-advanced-report-row';
import { formatAdvancedReportTotal } from './format-advanced-report-total';
import { HiveAdvancedReportVirtualTbody } from './hive-advanced-report-virtual-tbody';

type HiveAdvancedReportTableProps = {
  profileAccount: string;
  viewerUsername: string | null;
  initialRequest: HiveAdvancedReportRequest;
  initialResult: HiveAdvancedReportQueryResult;
  backHref: string;
};

type ReportMeta = {
  accounts: HiveAdvancedReportResponseApi['accounts'];
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
};

/** Sticky thead cells — needs solid bg + border-separate on the table. */
const ADVANCED_REPORT_TABLE_HEAD_CELL =
  'sticky top-0 z-10 bg-surface-control px-2 py-2 shadow-[inset_0_-1px_0_var(--color-border)]';

function filtersFromRequest(request: HiveAdvancedReportRequest): AdvancedReportFiltersState {
  return {
    startDate: unixToYmd(request.startDate),
    endDate: unixToYmd(request.endDate),
    filterAccounts: [...request.filterAccounts],
    currency: request.currency as SupportedCurrency,
  };
}

function requestFromFilters(
  filters: AdvancedReportFiltersState,
  profileAccount: string,
  viewerUsername: string | null,
  limit: number,
): HiveAdvancedReportRequest {
  const filterAccounts =
    filters.filterAccounts.length > 0
      ? [...new Set(filters.filterAccounts.map((name) => name.trim().toLowerCase()))]
      : [profileAccount.trim().toLowerCase()];

  return {
    accounts: filterAccounts.map((name) => ({ name })),
    filterAccounts,
    startDate: ymdToUnixStart(filters.startDate),
    endDate: ymdToUnixEnd(filters.endDate),
    limit,
    currency: filters.currency,
    viewer: viewerUsername?.trim().toLowerCase() || undefined,
  };
}

function initialReportMeta(result: HiveAdvancedReportQueryResult): ReportMeta {
  return {
    accounts: result.report?.accounts ?? [],
    hasMore: result.report?.hasMore ?? false,
    deposits: result.report?.deposits ?? 0,
    withdrawals: result.report?.withdrawals ?? 0,
  };
}

export function HiveAdvancedReportTable({
  profileAccount,
  viewerUsername,
  initialRequest,
  initialResult,
  backHref,
}: HiveAdvancedReportTableProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState(() => filtersFromRequest(initialRequest));
  const [wallet, setWallet] = useState<AdvancedReportRowApi[]>(
    () => initialResult.report?.wallet ?? [],
  );
  const [reportMeta, setReportMeta] = useState(() => initialReportMeta(initialResult));
  const [loadError, setLoadError] = useState(initialResult.error);
  const [dateEstablished, setDateEstablished] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const canToggleExemption =
    viewerUsername?.trim().toLowerCase() === profileAccount.trim().toLowerCase();

  const onSubmit = useCallback(() => {
    if (filters.filterAccounts.length === 0) {
      setAccountsError(true);
      return;
    }
    setAccountsError(false);
    setDateEstablished(true);
    setWallet([]);
    setReportMeta({ accounts: [], hasMore: false, deposits: 0, withdrawals: 0 });
    setLoadError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const body = requestFromFilters(
      filters,
      profileAccount,
      viewerUsername,
      initialRequest.limit,
    );

    setLoadingReport(true);
    void loadProgressiveHiveAdvancedReport(body, {
      signal: controller.signal,
      onPage: (update) => {
        if (controller.signal.aborted) {
          return;
        }
        setWallet(update.wallet);
        setReportMeta({
          accounts: update.accounts,
          hasMore: update.hasMore,
          deposits: update.deposits,
          withdrawals: update.withdrawals,
        });
      },
    })
      .then((finalResult) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(finalResult.error);
        if (finalResult.report) {
          setWallet(finalResult.report.wallet);
          setReportMeta({
            accounts: finalResult.report.accounts,
            hasMore: false,
            deposits: finalResult.report.deposits,
            withdrawals: finalResult.report.withdrawals,
          });
        }
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoadingReport(false);
        }
      });
  }, [filters, initialRequest.limit, profileAccount, viewerUsername]);

  const onToggleExemption = useCallback(
    (row: AdvancedReportRowView, checked: boolean) => {
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
        next[index] = { ...next[index], checked };
        const totals = totalsFromAdvancedReportWallet(next);
        setReportMeta((meta) => ({
          ...meta,
          deposits: totals.deposits,
          withdrawals: totals.withdrawals,
        }));
        return next;
      });
      void postHiveWalletExemptionClient({
        viewer: viewerUsername,
        account: row.userName,
        operationIndex: row.operationIndex,
        checked,
      });
    },
    [viewerUsername],
  );

  const onExportCsv = useCallback(async () => {
    if (wallet.length === 0 && !loadingReport) {
      return;
    }

    setExportingCsv(true);
    try {
      let exportWallet = wallet;
      let deposits = reportMeta.deposits;
      let withdrawals = reportMeta.withdrawals;

      if (loadingReport || reportMeta.hasMore) {
        const body = requestFromFilters(
          filters,
          profileAccount,
          viewerUsername,
          initialRequest.limit,
        );
        const fullResult = await loadFullHiveAdvancedReport(body);
        if (fullResult.error || !fullResult.report) {
          return;
        }
        exportWallet = fullResult.report.wallet;
        deposits = fullResult.report.deposits;
        withdrawals = fullResult.report.withdrawals;
      }

      const rows = exportWallet.map(buildAdvancedReportRowView);
      const csv = buildAdvancedReportCsv(
        rows,
        filters.currency,
        dateEstablished ? deposits : null,
        dateEstablished ? withdrawals : null,
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `advanced-report-${profileAccount}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  }, [
    dateEstablished,
    filters,
    initialRequest.limit,
    loadingReport,
    profileAccount,
    reportMeta.deposits,
    reportMeta.hasMore,
    reportMeta.withdrawals,
    viewerUsername,
    wallet,
  ]);

  const currency = filters.currency;
  const depositsDisplay = dateEstablished
    ? formatAdvancedReportTotal(reportMeta.deposits, currency)
    : '-';
  const withdrawalsDisplay = dateEstablished
    ? formatAdvancedReportTotal(reportMeta.withdrawals, currency)
    : '-';
  const statusLabel = !dateEstablished
    ? t('totals_calculated')
    : loadingReport
      ? reportMeta.hasMore
        ? `Loading… ${wallet.length}+`
        : 'Loading…'
      : `Completed (${wallet.length})`;

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-heading-sm font-weight-strong">{t('table_view')}</h1>
        <Link href={backHref} className="text-link text-body-sm">
          {t('table_back')}
        </Link>
      </div>

      <HiveAdvancedReportFilters
        value={filters}
        onChange={setFilters}
        onSubmit={onSubmit}
        submitting={loadingReport}
        accountsError={accountsError}
      />

      {loadError ? (
        <p className="mb-4 rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {loadError === 'invalid_response' ? t('activity_error') : t('unavailable')}
        </p>
      ) : null}

      <p className="mb-2 text-body-sm">
        <span className="font-weight-strong">{t('total')}</span>: {t('Deposits')}:{' '}
        <span className="font-weight-strong tabular-nums">{depositsDisplay}</span>.{' '}
        {t('Withdrawals')}:{' '}
        <span className="font-weight-strong tabular-nums">{withdrawalsDisplay}</span>. (
        {statusLabel}){' '}
        <button
          type="button"
          className="text-link disabled:opacity-50"
          disabled={(wallet.length === 0 && !loadingReport) || exportingCsv}
          onClick={() => void onExportCsv()}
        >
          {exportingCsv ? 'Exporting…' : 'Export to .CSV'}
        </button>
      </p>

      <p className="mb-2 text-body-sm text-muted">
        X) - {t('x_field_description')}
      </p>

      <p className="mb-4 text-body-sm text-muted">
        <span className="font-weight-strong text-fg">{t('disclaimer')}:</span>{' '}
        {t('disclaimer_info')}
      </p>

      <div
        ref={scrollRef}
        className="max-h-[calc(100dvh-var(--shell-header-height,3.5rem)-16rem)] w-full overflow-auto rounded-card border border-border"
      >
        <table className="w-full min-w-[960px] table-fixed border-separate border-spacing-0 text-left text-body-sm">
          <thead>
            <tr>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-10`}>X</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-28`}>{t('table_date')}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-20`}>{t('table_HIVE')}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-20`}>{t('table_HP')}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-20`}>{t('table_HBD')}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-24`}>{`HIVE/${currency}`}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-24`}>{`HBD/${currency}`}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-10`}>±</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-28`}>{t('account')}</th>
              <th className={`${ADVANCED_REPORT_TABLE_HEAD_CELL} w-40`}>{t('details')}</th>
              <th className={ADVANCED_REPORT_TABLE_HEAD_CELL}>{t('memo')}</th>
            </tr>
          </thead>
          <HiveAdvancedReportVirtualTbody
            wallet={wallet}
            scrollRef={scrollRef}
            canToggleExemption={canToggleExemption}
            onToggleExemption={onToggleExemption}
          />
        </table>
      </div>
    </div>
  );
}
