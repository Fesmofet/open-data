import { accountsForNextWaivAdvancedReportRequest } from './load-progressive-waiv-advanced-report.helpers';
import type {
  WaivAdvancedReportRowApi,
  WaivAdvancedReportQueryResult,
  WaivAdvancedReportRequest,
} from '../dto/waiv-advanced-report-api.schema';
import { fetchWaivAdvancedReportClient } from '../../infrastructure/clients/waiv-advanced-report.browser.client';
import {
  appendWaivAdvancedReportWalletPage,
  totalsFromWaivAdvancedReportWallet,
} from './load-full-waiv-advanced-report.helpers';

export async function loadWaivAdvancedReportPage(
  body: WaivAdvancedReportRequest,
  existingWallet: WaivAdvancedReportRowApi[] = [],
  signal?: AbortSignal,
): Promise<WaivAdvancedReportQueryResult> {
  if (signal?.aborted) {
    return { report: null, error: 'unavailable' };
  }

  const page = await fetchWaivAdvancedReportClient(body, signal);
  if (page.error || !page.report) {
    return page;
  }

  const wallet = appendWaivAdvancedReportWalletPage(existingWallet, page.report.wallet);
  const totals = totalsFromWaivAdvancedReportWallet(wallet);

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

export { accountsForNextWaivAdvancedReportRequest };
