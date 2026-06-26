import {
  waivAdvancedReportQueryResultSchema,
  type WaivAdvancedReportQueryResult,
  type WaivAdvancedReportRequest,
} from '../../application/dto/waiv-advanced-report-api.schema';

export async function fetchWaivAdvancedReportClient(
  body: WaivAdvancedReportRequest,
  signal?: AbortSignal,
): Promise<WaivAdvancedReportQueryResult> {
  try {
    const res = await fetch('/api/wallet/waiv/advanced-report', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
    if (res.status === 401 || res.status === 403) {
      return { report: null, error: 'unauthorized' };
    }
    if (!res.ok) {
      return { report: null, error: 'unavailable' };
    }
    const json: unknown = await res.json();
    const parsed = waivAdvancedReportQueryResultSchema.safeParse(json);
    if (!parsed.success) {
      return { report: null, error: 'invalid_response' };
    }
    return parsed.data;
  } catch {
    return { report: null, error: 'unavailable' };
  }
}
