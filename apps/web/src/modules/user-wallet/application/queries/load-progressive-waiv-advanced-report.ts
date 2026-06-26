import { accountsForNextWaivAdvancedReportRequest } from './load-progressive-waiv-advanced-report.helpers';
import type {
  WaivAdvancedReportRowApi,
  WaivAdvancedReportQueryResult,
  WaivAdvancedReportRequest,
  WaivAdvancedReportResponseApi,
} from '../dto/waiv-advanced-report-api.schema';
import { fetchWaivAdvancedReportClient } from '../../infrastructure/clients/waiv-advanced-report.browser.client';
import {
  appendWaivAdvancedReportWalletPage,
  dedupeIncomingWaivAdvancedReportRows,
  totalsFromWaivAdvancedReportWallet,
} from './load-full-waiv-advanced-report.helpers';

export type ProgressiveWaivAdvancedReportPageUpdate = {
  appended: WaivAdvancedReportRowApi[];
  wallet: WaivAdvancedReportRowApi[];
  accounts: WaivAdvancedReportResponseApi['accounts'];
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
};

export type LoadProgressiveWaivAdvancedReportOptions = {
  onPage?: (update: ProgressiveWaivAdvancedReportPageUpdate) => void;
  signal?: AbortSignal;
};

const MAX_PROGRESSIVE_PAGES = 5_000;

function buildPageUpdate(
  wallet: WaivAdvancedReportRowApi[],
  appended: WaivAdvancedReportRowApi[],
  accounts: WaivAdvancedReportResponseApi['accounts'],
  hasMore: boolean,
): ProgressiveWaivAdvancedReportPageUpdate {
  const totals = totalsFromWaivAdvancedReportWallet(wallet);
  return {
    appended,
    wallet,
    accounts,
    hasMore,
    deposits: totals.deposits,
    withdrawals: totals.withdrawals,
  };
}

function finalizeProgressiveReport(
  wallet: WaivAdvancedReportRowApi[],
  accounts: WaivAdvancedReportResponseApi['accounts'],
  truncated = false,
): WaivAdvancedReportQueryResult {
  const totals = totalsFromWaivAdvancedReportWallet(wallet);
  return {
    report: {
      wallet,
      accounts,
      hasMore: false,
      deposits: totals.deposits,
      withdrawals: totals.withdrawals,
      ...(truncated ? { truncated: true } : {}),
    },
    error: null,
  };
}

export async function loadProgressiveWaivAdvancedReport(
  initialBody: WaivAdvancedReportRequest,
  options: LoadProgressiveWaivAdvancedReportOptions = {},
): Promise<WaivAdvancedReportQueryResult> {
  let body = initialBody;
  let wallet: WaivAdvancedReportRowApi[] = [];
  let accounts: WaivAdvancedReportResponseApi['accounts'] = [];

  for (let pageCount = 0; pageCount < MAX_PROGRESSIVE_PAGES; pageCount += 1) {
    if (options.signal?.aborted) {
      return { report: null, error: 'unavailable' };
    }

    const page = await fetchWaivAdvancedReportClient(body, options.signal);
    if (page.error || !page.report) {
      return page;
    }

    const appended = dedupeIncomingWaivAdvancedReportRows(wallet, page.report.wallet);
    wallet = appendWaivAdvancedReportWalletPage(wallet, page.report.wallet);
    accounts = page.report.accounts;

    options.onPage?.(
      buildPageUpdate(wallet, appended, accounts, page.report.hasMore),
    );

    if (!page.report.hasMore) {
      return finalizeProgressiveReport(wallet, accounts);
    }

    const nextAccounts = accountsForNextWaivAdvancedReportRequest(page.report.accounts);
    if (nextAccounts.length === 0) {
      return finalizeProgressiveReport(wallet, accounts, page.report.hasMore);
    }

    body = {
      ...body,
      accounts: nextAccounts,
    };
  }

  return finalizeProgressiveReport(wallet, accounts, true);
}
