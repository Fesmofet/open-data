import 'server-only';

import {
  hiveAdvancedReportQueryResultSchema,
  hiveAdvancedReportResponseSchema,
  type HiveAdvancedReportQueryResult,
  type HiveAdvancedReportRequest,
} from '../dto/hive-advanced-report-api.schema';
import { fetchHiveAdvancedReport } from '../../infrastructure/clients/hive-advanced-report.client';

export async function getHiveAdvancedReportQuery(
  body: HiveAdvancedReportRequest,
): Promise<HiveAdvancedReportQueryResult> {
  const fetched = await fetchHiveAdvancedReport(body);
  if (!fetched.ok) {
    return {
      report: null,
      error: fetched.reason === 'unauthorized' ? 'unauthorized' : 'unavailable',
    };
  }
  const parsed = hiveAdvancedReportResponseSchema.safeParse(fetched.data);
  if (!parsed.success) {
    return { report: null, error: 'invalid_response' };
  }
  const result = { report: parsed.data, error: null };
  const validated = hiveAdvancedReportQueryResultSchema.safeParse(result);
  return validated.success ? validated.data : { report: null, error: 'invalid_response' };
}
