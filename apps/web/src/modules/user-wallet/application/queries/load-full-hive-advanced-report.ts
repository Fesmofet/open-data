import type {
  HiveAdvancedReportQueryResult,
  HiveAdvancedReportRequest,
} from '../dto/hive-advanced-report-api.schema';
import { loadProgressiveHiveAdvancedReport } from './load-progressive-hive-advanced-report';

export type LoadFullHiveAdvancedReportOptions = {
  onProgress?: (result: HiveAdvancedReportQueryResult) => void;
  signal?: AbortSignal;
};

/**
 * Fetches all advanced-report pages until `hasMore` is false (legacy auto-pagination).
 */
export async function loadFullHiveAdvancedReport(
  initialBody: HiveAdvancedReportRequest,
  options: LoadFullHiveAdvancedReportOptions = {},
): Promise<HiveAdvancedReportQueryResult> {
  return loadProgressiveHiveAdvancedReport(initialBody, {
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
