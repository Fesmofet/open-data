import 'server-only';

import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';

import { userActivityResponseSchema } from '../dto/activity-api.schema';
import { buildActivityPageViews } from '../mappers/build-activity-row-view';
import type {
  ActivityLoadError,
  ActivityPageQueryResult,
  ActivityPageView,
} from '../../domain/types/activity-row-view';
import { fetchUserActivity } from '../../infrastructure/clients/activity.client';

const EMPTY_PAGE: ActivityPageView = {
  items: [],
  cursor: null,
  hasMore: false,
  chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
};

function toQueryResult(
  page: ActivityPageView,
  error: ActivityLoadError | null = null,
): ActivityPageQueryResult {
  return { page, error };
}

export async function getUserActivityPageQuery(
  accountName: string,
  body: {
    limit?: number;
    cursor?: string;
    filters?: ActivityFilterKey[];
  } = {},
): Promise<ActivityPageQueryResult> {
  const raw = await fetchUserActivity(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
    filters: body.filters ?? [],
  });
  if (!raw) {
    return toQueryResult(EMPTY_PAGE, 'unavailable');
  }
  const parsed = userActivityResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return toQueryResult(EMPTY_PAGE, 'invalid_response');
  }
  const chainContext = parsed.data.chainContext;
  return toQueryResult({
    items: buildActivityPageViews(parsed.data.items, {
      profileAccount: accountName,
      chainContext,
    }),
    cursor: parsed.data.cursor,
    hasMore: parsed.data.hasMore,
    chainContext,
  });
}
