import type { NotificationSettingsDto } from '../application/notification-settings.types';

export async function fetchNotificationSettingsClient(
  accountName: string,
  signal?: AbortSignal,
): Promise<NotificationSettingsDto | null> {
  try {
    const res = await fetch(
      `/api/users/${encodeURIComponent(accountName)}/notification-settings`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal,
      },
    );
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as NotificationSettingsDto;
  } catch {
    return null;
  }
}
