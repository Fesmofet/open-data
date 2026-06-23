import 'server-only';

import { queryApiFetchLive } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type {
  HiveAdvancedReportRequest,
  HiveAdvancedReportResponseApi,
} from '../../application/dto/hive-advanced-report-api.schema';

export async function fetchHiveAdvancedReport(
  body: HiveAdvancedReportRequest,
): Promise<HiveAdvancedReportResponseApi | null> {
  return queryApiFetchLive<HiveAdvancedReportResponseApi>(
    '/query/v1/wallet/hive/advanced-report',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export async function postHiveWalletExemption(body: {
  viewer: string;
  account: string;
  operationIndex: number;
  checked: boolean;
}): Promise<{ result: boolean } | null> {
  return queryApiFetchLive<{ result: boolean }>('/query/v1/wallet/hive/exemptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
