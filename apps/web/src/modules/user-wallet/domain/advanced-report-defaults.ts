import type { SupportedCurrency } from '@opden-data-layer/core/constants';
import { ADVANCED_REPORT_DEFAULT_PAGE_SIZE } from '@opden-data-layer/core/hive-advanced-report';

import type { HiveAdvancedReportRequest } from '../application/dto/hive-advanced-report-api.schema';

const DAY_SEC = 86_400;

function startOfUtcDay(unix: number): number {
  const d = new Date(unix * 1000);
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000,
  );
}

export function defaultAdvancedReportDateRange(nowSec = Math.floor(Date.now() / 1000)): {
  startDate: number;
  endDate: number;
} {
  const endDate = startOfUtcDay(nowSec - DAY_SEC) + DAY_SEC - 1;
  const startDate = startOfUtcDay(endDate - 29 * DAY_SEC);
  return { startDate, endDate };
}

export function buildInitialAdvancedReportRequest(params: {
  profileAccount: string;
  filterAccounts?: readonly string[];
  currency?: SupportedCurrency;
  viewer?: string | null;
}): HiveAdvancedReportRequest {
  const account = params.profileAccount.trim().toLowerCase();
  const filterAccounts = (
    params.filterAccounts?.length ? params.filterAccounts : [account]
  ).map((name) => name.trim().toLowerCase());
  const uniqueAccounts = [...new Set(filterAccounts)];
  const { startDate, endDate } = defaultAdvancedReportDateRange();

  return {
    accounts: uniqueAccounts.map((name) => ({ name })),
    filterAccounts: uniqueAccounts,
    startDate,
    endDate,
    limit: ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
    currency: params.currency ?? 'USD',
    viewer: params.viewer?.trim().toLowerCase() || undefined,
  };
}
