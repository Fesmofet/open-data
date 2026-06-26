import type {
  WaivAdvancedReportQueryResult,
  WaivAdvancedReportRequest,
} from '../dto/waiv-advanced-report-api.schema';
import { loadProgressiveWaivAdvancedReport } from './load-progressive-waiv-advanced-report';

export type LoadFullWaivAdvancedReportOptions = {
  onProgress?: (result: WaivAdvancedReportQueryResult) => void;
  signal?: AbortSignal;
};

export async function loadFullWaivAdvancedReport(
  initialBody: WaivAdvancedReportRequest,
  options: LoadFullWaivAdvancedReportOptions = {},
): Promise<WaivAdvancedReportQueryResult> {
  return loadProgressiveWaivAdvancedReport(initialBody, {
    signal: options.signal,
    onPage: (update) => {
      options.onProgress?.({
        report: {
          wallet: update.wallet,
          accounts: update.accounts,
          hasMore: update.hasMore,
          deposits: update.deposits,
          withdrawals: update.withdrawals,
        },
        error: null,
      });
    },
  });
}
