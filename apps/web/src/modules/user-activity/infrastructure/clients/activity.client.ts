import 'server-only';

import type { ActivityFilterKey } from '@opden-data-layer/core/hive-account-history';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import { serializeActivityFilterKeys } from '../../domain/activity-filters-url';
import type { UserActivityResponseApi } from '../../application/dto/activity-api.schema';

export async function fetchUserActivity(
  accountName: string,
  body: { limit?: number; cursor?: string; filters?: ActivityFilterKey[] },
): Promise<UserActivityResponseApi | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/activity`;
  const filters = body.filters ?? [];
  const filtersKey =
    filters.length > 0 ? serializeActivityFilterKeys(filters) : '';
  const cacheTags = [queryApiCacheTags.userActivityFeed(accountName)];
  if (filtersKey.length > 0) {
    cacheTags.push(queryApiCacheTags.userActivityFeed(accountName, filtersKey));
  }
  return queryApiFetch<UserActivityResponseApi>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: body.limit,
      cursor: body.cursor,
      filters,
    }),
    cacheTags,
  });
}
