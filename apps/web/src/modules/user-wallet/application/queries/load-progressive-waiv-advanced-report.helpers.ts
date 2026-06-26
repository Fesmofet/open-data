import type {
  WaivAdvancedReportRequest,
  WaivAdvancedReportResponseApi,
} from '../dto/waiv-advanced-report-api.schema';

export function accountsForNextWaivAdvancedReportRequest(
  pageAccounts: WaivAdvancedReportResponseApi['accounts'],
): WaivAdvancedReportRequest['accounts'] {
  return pageAccounts
    .filter((account) => account.hasMore)
    .map((account) => ({
      name: account.name,
      ...(account.cursor != null ? { cursor: account.cursor } : {}),
    }));
}
