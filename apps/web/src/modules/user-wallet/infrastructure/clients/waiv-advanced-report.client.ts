import 'server-only';

import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';

import type {
  WaivAdvancedReportRequest,
  WaivAdvancedReportResponseApi,
} from '../../application/dto/waiv-advanced-report-api.schema';

export type WaivAdvancedReportFetchResult =
  | { ok: true; data: WaivAdvancedReportResponseApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' };

export async function fetchWaivAdvancedReport(
  body: WaivAdvancedReportRequest,
): Promise<WaivAdvancedReportFetchResult> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { ok: false, reason: 'unauthorized' };
  }

  const outcome = await queryApiFetchOutcome<WaivAdvancedReportResponseApi>(
    '/query/v1/wallet/waiv/advanced-report',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      ...QUERY_API_LIVE_INIT,
    },
  );

  if (outcome.ok) {
    return { ok: true, data: outcome.data };
  }
  if (outcome.status === 401 || outcome.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  return { ok: false, reason: 'unavailable' };
}
