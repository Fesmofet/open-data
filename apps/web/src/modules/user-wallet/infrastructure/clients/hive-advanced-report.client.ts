import 'server-only';

import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';

import type {
  HiveAdvancedReportRequest,
  HiveAdvancedReportResponseApi,
} from '../../application/dto/hive-advanced-report-api.schema';

export type HiveAdvancedReportFetchResult =
  | { ok: true; data: HiveAdvancedReportResponseApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' };

/**
 * Authenticated fetch to query-api (Bearer from access cookie). No Next.js HTTP cache.
 */
export async function fetchHiveAdvancedReport(
  body: HiveAdvancedReportRequest,
): Promise<HiveAdvancedReportFetchResult> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { ok: false, reason: 'unauthorized' };
  }

  const outcome = await queryApiFetchOutcome<HiveAdvancedReportResponseApi>(
    '/query/v1/wallet/hive/advanced-report',
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

export async function postHiveWalletExemption(body: {
  viewer: string;
  account: string;
  operationIndex: number;
  checked: boolean;
}): Promise<{ result: boolean } | null> {
  const token = await getBearerAccessToken();
  if (!token) {
    return null;
  }

  const outcome = await queryApiFetchOutcome<{ result: boolean }>(
    '/query/v1/wallet/hive/exemptions',
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

  return outcome.ok ? outcome.data : null;
}
