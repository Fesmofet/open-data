import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';

import type { ActivityPageQueryResult } from '../../domain/types/activity-row-view';
import { activityPageQueryResultSchema } from '../../application/dto/activity-api.schema';

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
    const json: unknown = await res.json();
    const parsed = activityPageQueryResultSchema.safeParse(json);
    if (!parsed.success) {
      return { page: { items: [], cursor: null, hasMore: false, chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' } }, error: 'invalid_response' };
    }
    return parsed.data as ActivityPageQueryResult;
  } catch {
    return null;
  }
}
