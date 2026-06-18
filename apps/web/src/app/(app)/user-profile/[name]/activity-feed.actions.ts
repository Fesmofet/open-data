'use server';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { getUserActivityPageQuery } from '@/modules/user-activity/application/queries/get-user-activity-page.query';

export async function loadMoreUserActivityAction(
  accountName: string,
  cursor: string,
) {
  return getUserActivityPageQuery(accountName, {
    cursor,
    limit: ACTIVITY_DISPLAY_PAGE_SIZE,
  });
}
