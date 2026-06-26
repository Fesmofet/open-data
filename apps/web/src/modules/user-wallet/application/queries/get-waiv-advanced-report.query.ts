import 'server-only';

import {
  waivAdvancedReportQueryResultSchema,
  waivAdvancedReportResponseSchema,
  type WaivAdvancedReportQueryResult,
  type WaivAdvancedReportRequest,
} from '../dto/waiv-advanced-report-api.schema';
import { fetchWaivAdvancedReport } from '../../infrastructure/clients/waiv-advanced-report.client';

export async function getWaivAdvancedReportQuery(
  body: WaivAdvancedReportRequest,
): Promise<WaivAdvancedReportQueryResult> {
  const fetched = await fetchWaivAdvancedReport(body);
  if (!fetched.ok) {
    return {
      report: null,
      error: fetched.reason === 'unauthorized' ? 'unauthorized' : 'unavailable',
    };
  }
  const parsed = waivAdvancedReportResponseSchema.safeParse(fetched.data);
  if (!parsed.success) {
    return { report: null, error: 'invalid_response' };
  }
  const result = { report: parsed.data, error: null };
  const validated = waivAdvancedReportQueryResultSchema.safeParse(result);
  return validated.success ? validated.data : { report: null, error: 'invalid_response' };
}
