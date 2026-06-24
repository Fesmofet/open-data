import { accountsForNextAdvancedReportRequest } from './load-progressive-hive-advanced-report.helpers';
import type {
  AdvancedReportRowApi,
  HiveAdvancedReportQueryResult,
  HiveAdvancedReportRequest,
  HiveAdvancedReportResponseApi,
} from '../dto/hive-advanced-report-api.schema';
import { fetchHiveAdvancedReportClient } from '../../infrastructure/clients/hive-advanced-report.browser.client';
import {
  appendAdvancedReportWalletPage,
  dedupeIncomingAdvancedReportRows,
  totalsFromAdvancedReportWallet,
} from './load-full-hive-advanced-report.helpers';

export type ProgressiveAdvancedReportPageUpdate = {
  appended: AdvancedReportRowApi[];
  wallet: AdvancedReportRowApi[];
  accounts: HiveAdvancedReportResponseApi['accounts'];
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
};

export type LoadProgressiveHiveAdvancedReportOptions = {
  onPage?: (update: ProgressiveAdvancedReportPageUpdate) => void;
  signal?: AbortSignal;
};

const MAX_PROGRESSIVE_PAGES = 5_000;

function buildPageUpdate(
  wallet: AdvancedReportRowApi[],
  appended: AdvancedReportRowApi[],
  accounts: HiveAdvancedReportResponseApi['accounts'],
  hasMore: boolean,
): ProgressiveAdvancedReportPageUpdate {
  const totals = totalsFromAdvancedReportWallet(wallet);
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
  wallet: AdvancedReportRowApi[],
  accounts: HiveAdvancedReportResponseApi['accounts'],
  truncated = false,
): HiveAdvancedReportQueryResult {
  const totals = totalsFromAdvancedReportWallet(wallet);
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

/**
 * Fetches advanced-report pages sequentially, appending each page into a sorted wallet store.
 */
export async function loadProgressiveHiveAdvancedReport(
  initialBody: HiveAdvancedReportRequest,
  options: LoadProgressiveHiveAdvancedReportOptions = {},
): Promise<HiveAdvancedReportQueryResult> {
  let body = initialBody;
  let wallet: AdvancedReportRowApi[] = [];
  let accounts: HiveAdvancedReportResponseApi['accounts'] = [];

  for (let pageCount = 0; pageCount < MAX_PROGRESSIVE_PAGES; pageCount += 1) {
    if (options.signal?.aborted) {
      return { report: null, error: 'unavailable' };
    }

    const page = await fetchHiveAdvancedReportClient(body, options.signal);
    if (page.error || !page.report) {
      return page;
    }

    const appended = dedupeIncomingAdvancedReportRows(wallet, page.report.wallet);
    wallet = appendAdvancedReportWalletPage(wallet, page.report.wallet);
    accounts = page.report.accounts;

    options.onPage?.(
      buildPageUpdate(wallet, appended, accounts, page.report.hasMore),
    );

    if (!page.report.hasMore) {
      return finalizeProgressiveReport(wallet, accounts);
    }

    const nextAccounts = accountsForNextAdvancedReportRequest(page.report.accounts);
    if (nextAccounts.length === 0) {
      return finalizeProgressiveReport(wallet, accounts);
    }

    body = {
      ...body,
      accounts: nextAccounts,
    };
  }

  return finalizeProgressiveReport(wallet, accounts, true);
}
