import type { HiveAdvancedReportQueryResult, HiveAdvancedReportRequest } from '../dto/hive-advanced-report-api.schema';
import { fetchHiveAdvancedReportClient } from '../../infrastructure/clients/hive-advanced-report.browser.client';

export async function loadHiveAdvancedReportPage(
  body: HiveAdvancedReportRequest,
): Promise<HiveAdvancedReportQueryResult> {
  return fetchHiveAdvancedReportClient(body);
}
