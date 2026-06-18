import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';

import type { ActivityPageQueryResult } from '../../domain/types/activity-row-view';

export async function fetchUserActivityPageClient(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
    filters?: ActivityFilterKey[];
  },
  signal?: AbortSignal,
): Promise<ActivityPageQueryResult | null> {
  try {
    const res = await fetch(
      `/api/users/${encodeURIComponent(accountName)}/activity`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
          cursor: body.cursor,
          filters: body.filters ?? [],
        }),
        cache: 'no-store',
        signal,
      },
    );
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as ActivityPageQueryResult;
  } catch {
    return null;
  }
}
