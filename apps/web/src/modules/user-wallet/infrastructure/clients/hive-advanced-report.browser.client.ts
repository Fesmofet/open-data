import {
  hiveAdvancedReportQueryResultSchema,
  type HiveAdvancedReportQueryResult,
  type HiveAdvancedReportRequest,
} from '../../application/dto/hive-advanced-report-api.schema';

export async function fetchHiveAdvancedReportClient(
  body: HiveAdvancedReportRequest,
  signal?: AbortSignal,
): Promise<HiveAdvancedReportQueryResult> {
  try {
    const res = await fetch('/api/wallet/hive/advanced-report', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
    if (!res.ok) {
      return { report: null, error: 'unavailable' };
    }
    const json: unknown = await res.json();
    const parsed = hiveAdvancedReportQueryResultSchema.safeParse(json);
    if (!parsed.success) {
      return { report: null, error: 'invalid_response' };
    }
    return parsed.data;
  } catch {
    return { report: null, error: 'unavailable' };
  }
}

export async function postHiveWalletExemptionClient(body: {
  viewer: string;
  account: string;
  operationIndex: number;
  checked: boolean;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/wallet/hive/exemptions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      return false;
    }
    const json = (await res.json()) as { result?: boolean };
    return json.result === true;
  } catch {
    return false;
  }
}
