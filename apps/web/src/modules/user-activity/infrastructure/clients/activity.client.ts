import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { UserActivityResponseApi } from '../../application/dto/activity-api.schema';

export async function fetchUserActivity(
  accountName: string,
  body: { limit?: number; cursor?: string },
): Promise<UserActivityResponseApi | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/activity`;
  return queryApiFetch<UserActivityResponseApi>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cacheTags: [queryApiCacheTags.userActivityFeed(accountName)],
  });
}
