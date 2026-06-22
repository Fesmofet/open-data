import 'server-only';

import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';

import { getUserActivityPageQuery } from '@/modules/user-activity/application/queries/get-user-activity-page.query';
import type { ActivityPageQueryResult } from '@/modules/user-activity/domain/types/activity-row-view';

const WALLET_HISTORY_FILTERS: ActivityFilterKey[] = ['wallet'];

export async function getHiveWalletHistoryPageQuery(
  accountName: string,
  body: { limit?: number; cursor?: string } = {},
): Promise<ActivityPageQueryResult> {
  return getUserActivityPageQuery(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
    filters: WALLET_HISTORY_FILTERS,
  });
}
