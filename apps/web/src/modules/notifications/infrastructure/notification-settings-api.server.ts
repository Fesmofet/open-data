import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type { NotificationSettingsDto } from '../application/notification-settings.types';

export async function fetchNotificationSettings(
  accountName: string,
): Promise<NotificationSettingsDto | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/notification-settings`;
  return queryApiFetch<NotificationSettingsDto>(path, {
    headers: { 'X-Viewer': accountName },
    cacheTags: [queryApiCacheTags.userNotificationSettings(accountName)],
  });
}
