'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SupportedCurrency } from '@opden-data-layer/core/constants';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { WaivAdvancedReportRequest } from '../../../../application/dto/waiv-advanced-report-api.schema';
import type {
  WaivAdvancedReportRowApi,
  WaivAdvancedReportQueryResult,
  WaivAdvancedReportResponseApi,
} from '../../../../application/dto/waiv-advanced-report-api.schema';
import {
  buildWaivAdvancedReportRowView,
  type WaivAdvancedReportRowView,
} from '../../../../application/mappers/build-waiv-advanced-report-row-view';
import { loadFullWaivAdvancedReport } from '../../../../application/queries/load-full-waiv-advanced-report';
import { totalsFromWaivAdvancedReportWallet } from '../../../../application/queries/load-full-waiv-advanced-report.helpers';
import {
  accountsForNextWaivAdvancedReportRequest,
  loadWaivAdvancedReportPage,
} from '../../../../application/queries/load-waiv-advanced-report-page';
import { loadProgressiveWaivAdvancedReport } from '../../../../application/queries/load-progressive-waiv-advanced-report';
import { postHiveWalletExemptionClient } from '../../../../infrastructure/clients/hive-advanced-report.browser.client';
import { fetchHiveAccountCreatedDatesClient } from '../../../../infrastructure/clients/hive-account-created-dates.browser.client';
import { defaultAdvancedReportDateRange } from '../../../../domain/advanced-report-defaults';
import {
  maxAdvancedReportTillYmd,
  unixToYmd,
  validateAdvancedReportDateRange,
  ymdToUnixEnd,
  ymdToUnixStart,
  type AdvancedReportDateRangeError,
} from '../../../../domain/advanced-report-date-range';
import {
  WaivAdvancedReportFilters,
  type WaivAdvancedReportFiltersState,
} from './waiv-advanced-report-filters';
import { buildWaivAdvancedReportCsv } from './waiv-advanced-report-row';
import { formatAdvancedReportTotal } from '../../hive/advanced-report/format-advanced-report-total';
import {
  WAIV_ADVANCED_REPORT_TABLE_HEAD_CELL,
  waivAdvancedReportTableGridStyle,
} from './waiv-advanced-report-table-layout';
import { WaivAdvancedReportVirtualTbody } from './waiv-advanced-report-virtual-tbody';

type WaivAdvancedReportTableProps = {
  profileAccount: string;
  viewerUsername: string | null;
  initialRequest: WaivAdvancedReportRequest;
  initialResult: WaivAdvancedReportQueryResult;
  backHref: string;
};

type ReportMeta = {
  accounts: WaivAdvancedReportResponseApi['accounts'];
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
  /** Currency used for loaded rows and totals; updated on submit/page load, not on filter change. */
  currency: SupportedCurrency;
};

function filtersFromRequest(request: WaivAdvancedReportRequest): WaivAdvancedReportFiltersState {
  const defaults = defaultAdvancedReportDateRange();
  return {
    startDate: unixToYmd(request.startDate ?? defaults.startDate),
    endDate: unixToYmd(request.endDate ?? defaults.endDate),
    filterAccounts: [...request.filterAccounts],
    currency: request.currency as SupportedCurrency,
    excludeSwapsAndTrades: !request.includeSwapsAndTrades,
  };
}

function buildBrowseRequest(
  profileAccount: string,
  viewerUsername: string | null,
  limit: number,
  currency: SupportedCurrency,
  includeSwapsAndTrades: boolean,
  accounts?: WaivAdvancedReportRequest['accounts'],
): WaivAdvancedReportRequest {
  const name = profileAccount.trim().toLowerCase();
  return {
    accounts: accounts ?? [{ name }],
    filterAccounts: [name],
    limit,
    currency,
    viewer: viewerUsername?.trim().toLowerCase() || undefined,
    includeSwapsAndTrades,
  };
}

function applyPageResult(
  result: WaivAdvancedReportQueryResult,
  currency: SupportedCurrency,
  setWallet: (rows: WaivAdvancedReportRowApi[]) => void,
  setReportMeta: (meta: ReportMeta) => void,
  setLoadError: (error: WaivAdvancedReportQueryResult['error']) => void,
): void {
  setLoadError(result.error);
  if (!result.report) {
    return;
  }
  setWallet(result.report.wallet);
  setReportMeta({
    accounts: result.report.accounts,
    hasMore: result.report.hasMore,
    deposits: result.report.deposits,
    withdrawals: result.report.withdrawals,
    currency,
  });
}

function requestFromFilters(
  filters: WaivAdvancedReportFiltersState,
  profileAccount: string,
  viewerUsername: string | null,
  limit: number,
): WaivAdvancedReportRequest {
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
    includeSwapsAndTrades: !filters.excludeSwapsAndTrades,
  };
}

function initialReportMeta(
  result: WaivAdvancedReportQueryResult,
  currency: SupportedCurrency,
): ReportMeta {
  return {
    accounts: result.report?.accounts ?? [],
    hasMore: result.report?.hasMore ?? false,
    deposits: result.report?.deposits ?? 0,
    withdrawals: result.report?.withdrawals ?? 0,
    currency,
  };
}

export function WaivAdvancedReportTable({
  profileAccount,
  viewerUsername,
  initialRequest,
  initialResult,
  backHref,
}: WaivAdvancedReportTableProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState(() => filtersFromRequest(initialRequest));
  const [wallet, setWallet] = useState<WaivAdvancedReportRowApi[]>(
    () => initialResult.report?.wallet ?? [],
  );
  const [reportMeta, setReportMeta] = useState(() =>
    initialReportMeta(initialResult, initialRequest.currency as SupportedCurrency),
  );
  const [loadError, setLoadError] = useState(initialResult.error);
  const [dateEstablished, setDateEstablished] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const [dateRangeError, setDateRangeError] = useState<AdvancedReportDateRangeError | null>(
    null,
  );
  const maxTillDate = maxAdvancedReportTillYmd();
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingCreation, setLoadingCreation] = useState(false);
  const [creationError, setCreationError] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!viewerUsername) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const body = buildBrowseRequest(
      profileAccount,
      viewerUsername,
      initialRequest.limit,
      initialRequest.currency as SupportedCurrency,
      initialRequest.includeSwapsAndTrades,
    );

    setLoadingReport(true);
    setLoadError(null);
    void loadWaivAdvancedReportPage(body, [], controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        applyPageResult(
          result,
          initialRequest.currency as SupportedCurrency,
          setWallet,
          setReportMeta,
          setLoadError,
        );
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoadingReport(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [profileAccount, viewerUsername, initialRequest.limit, initialRequest.currency, initialRequest.includeSwapsAndTrades]);

  const canToggleExemption = Boolean(viewerUsername?.trim());

  const onSubmit = useCallback(() => {
    if (filters.filterAccounts.length === 0) {
      setAccountsError(true);
      return;
    }
    setAccountsError(false);

    const rangeError = validateAdvancedReportDateRange(
      filters.startDate,
      filters.endDate,
    );
    if (rangeError) {
      setDateRangeError(rangeError);
      return;
    }
    setDateRangeError(null);
    setDateEstablished(true);
    setWallet([]);
    setReportMeta({
      accounts: [],
      hasMore: false,
      deposits: 0,
      withdrawals: 0,
      currency: filters.currency,
    });
    setLoadError(null);
    setTruncated(false);
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
    void loadProgressiveWaivAdvancedReport(body, {
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
          currency: filters.currency,
        });
      },
    })
      .then((finalResult) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(finalResult.error);
        if (finalResult.report) {
          setTruncated(finalResult.report.truncated === true);
          setWallet(finalResult.report.wallet);
          setReportMeta({
            accounts: finalResult.report.accounts,
            hasMore: false,
            deposits: finalResult.report.deposits,
            withdrawals: finalResult.report.withdrawals,
            currency: filters.currency,
          });
        }
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoadingReport(false);
        }
      });
  }, [filters, initialRequest.limit, profileAccount, viewerUsername]);

  const onShowMore = useCallback(() => {
    if (dateEstablished) {
      return;
    }
    const nextAccounts = accountsForNextWaivAdvancedReportRequest(reportMeta.accounts);
    if (nextAccounts.length === 0) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const body = {
      ...buildBrowseRequest(
        profileAccount,
        viewerUsername,
        initialRequest.limit,
        reportMeta.currency,
        !filters.excludeSwapsAndTrades,
        nextAccounts,
      ),
    };

    setLoadingReport(true);
    void loadWaivAdvancedReportPage(body, wallet, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        applyPageResult(
          result,
          reportMeta.currency,
          setWallet,
          setReportMeta,
          setLoadError,
        );
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoadingReport(false);
        }
      });
  }, [
    dateEstablished,
    initialRequest.limit,
    profileAccount,
    reportMeta.accounts,
    reportMeta.currency,
    viewerUsername,
    wallet,
  ]);

  const onFromAccountCreation = useCallback(() => {
    const accountNames =
      filters.filterAccounts.length > 0
        ? [...new Set(filters.filterAccounts.map((name) => name.trim().toLowerCase()))]
        : [profileAccount.trim().toLowerCase()];

    setCreationError(false);
    setLoadingCreation(true);
    void fetchHiveAccountCreatedDatesClient({ accounts: accountNames })
      .then((result) => {
        if (!result.ok || !result.data.startDateYmd) {
          setCreationError(true);
          return;
        }
        setFilters((prev) => ({
          ...prev,
          startDate: result.data.startDateYmd!,
        }));
        setDateRangeError(null);
      })
      .finally(() => {
        setLoadingCreation(false);
      });
  }, [filters.filterAccounts, profileAccount]);

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
        next[index] = { ...next[index], checked };
        if (dateEstablished) {
          const totals = totalsFromWaivAdvancedReportWallet(next);
          setReportMeta((meta) => ({
            ...meta,
            deposits: totals.deposits,
            withdrawals: totals.withdrawals,
          }));
        }
        return next;
      });
      void postHiveWalletExemptionClient({
        viewer: viewerUsername,
        account: row.userName,
        operationIndex: row.operationIndex,
        checked,
      });
    },
    [viewerUsername, dateEstablished],
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

      if (dateEstablished && (loadingReport || reportMeta.hasMore)) {
        const body = {
          ...requestFromFilters(
            filters,
            profileAccount,
            viewerUsername,
            initialRequest.limit,
          ),
          currency: reportMeta.currency,
        };
        const fullResult = await loadFullWaivAdvancedReport(body);
        if (fullResult.error || !fullResult.report) {
          return;
        }
        exportWallet = fullResult.report.wallet;
        deposits = fullResult.report.deposits;
        withdrawals = fullResult.report.withdrawals;
      }

      const rows = exportWallet.map(buildWaivAdvancedReportRowView);
      const csv = buildWaivAdvancedReportCsv(
        rows,
        reportMeta.currency,
        dateEstablished ? deposits : null,
        dateEstablished ? withdrawals : null,
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `waiv-advanced-report-${profileAccount}.csv`;
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
    reportMeta.currency,
    reportMeta.deposits,
    reportMeta.hasMore,
    reportMeta.withdrawals,
    viewerUsername,
    wallet,
  ]);

  const reportCurrency = reportMeta.currency;
  const depositsDisplay = dateEstablished
    ? formatAdvancedReportTotal(reportMeta.deposits, reportCurrency)
    : '-';
  const withdrawalsDisplay = dateEstablished
    ? formatAdvancedReportTotal(reportMeta.withdrawals, reportCurrency)
    : '-';
  const statusLabel = !dateEstablished
    ? t('totals_calculated')
    : loadingReport
      ? reportMeta.hasMore
        ? t('advanced_report_loading_count').replace('{count}', String(wallet.length))
        : t('advanced_report_loading')
      : truncated
        ? t('advanced_report_partial').replace('{count}', String(wallet.length))
        : t('advanced_report_completed_count').replace('{count}', String(wallet.length));

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-heading-sm font-weight-strong">{t('table_view')}</h1>
        <Link href={backHref} className="text-link text-body-sm" suppressHydrationWarning>
          {t('table_back')}
        </Link>
      </div>

      <WaivAdvancedReportFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setDateRangeError(null);
          setCreationError(false);
        }}
        onSubmit={onSubmit}
        onFromAccountCreation={onFromAccountCreation}
        submitting={loadingReport}
        loadingCreation={loadingCreation}
        creationError={creationError}
        accountsError={accountsError}
        dateRangeError={dateRangeError}
        maxTillDate={maxTillDate}
      />

      {loadError ? (
        <p className="mb-4 rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {loadError === 'invalid_response'
            ? t('activity_error')
            : loadError === 'unauthorized'
              ? t('advanced_report_unauthorized')
              : t('unavailable')}
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
          {exportingCsv ? t('advanced_report_exporting') : t('advanced_report_export_csv')}
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
                {`WAIV/${reportCurrency}`}
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
            canToggleExemption={canToggleExemption}
            onToggleExemption={onToggleExemption}
          />
        </div>
      </div>

      {!dateEstablished && reportMeta.hasMore ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="rounded-button border border-border bg-surface-control px-5 py-2 text-body-sm font-weight-strong disabled:opacity-60"
            disabled={loadingReport}
            onClick={onShowMore}
          >
            {loadingReport ? t('activity_loading') : t('show_more')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
