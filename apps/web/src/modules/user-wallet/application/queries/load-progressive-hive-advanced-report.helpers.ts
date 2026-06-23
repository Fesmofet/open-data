import type {
  HiveAdvancedReportRequest,
  HiveAdvancedReportResponseApi,
} from '../dto/hive-advanced-report-api.schema';

/**
 * Build the next request's per-account cursors.
 * Legacy omits exhausted accounts from the next request instead of refetching them.
 */
export function accountsForNextAdvancedReportRequest(
  pageAccounts: HiveAdvancedReportResponseApi['accounts'],
): HiveAdvancedReportRequest['accounts'] {
  return pageAccounts
    .filter((account) => account.hasMore)
    .map((account) => ({
      name: account.name,
      ...(account.cursor != null ? { cursor: account.cursor } : {}),
    }));
}
