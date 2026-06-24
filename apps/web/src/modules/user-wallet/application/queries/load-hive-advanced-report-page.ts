import { accountsForNextAdvancedReportRequest } from './load-progressive-hive-advanced-report.helpers';
import type {
  AdvancedReportRowApi,
  HiveAdvancedReportQueryResult,
  HiveAdvancedReportRequest,
} from '../dto/hive-advanced-report-api.schema';
import { fetchHiveAdvancedReportClient } from '../../infrastructure/clients/hive-advanced-report.browser.client';
import {
  appendAdvancedReportWalletPage,
  totalsFromAdvancedReportWallet,
} from './load-full-hive-advanced-report.helpers';

/**
 * Fetches a single advanced-report page and merges it into an existing wallet.
 */
export async function loadHiveAdvancedReportPage(
  body: HiveAdvancedReportRequest,
  existingWallet: AdvancedReportRowApi[] = [],
  signal?: AbortSignal,
): Promise<HiveAdvancedReportQueryResult> {
  if (signal?.aborted) {
    return { report: null, error: 'unavailable' };
  }

  const page = await fetchHiveAdvancedReportClient(body, signal);
  if (page.error || !page.report) {
    return page;
  }

  const wallet = appendAdvancedReportWalletPage(existingWallet, page.report.wallet);
  const totals = totalsFromAdvancedReportWallet(wallet);

  return {
    report: {
      wallet,
      accounts: page.report.accounts,
      hasMore: page.report.hasMore,
      deposits: totals.deposits,
      withdrawals: totals.withdrawals,
    },
    error: null,
  };
}

export { accountsForNextAdvancedReportRequest };
