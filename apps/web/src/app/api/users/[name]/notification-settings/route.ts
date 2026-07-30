import { type NextRequest, NextResponse } from 'next/server';

import { fetchNotificationSettings } from '@/modules/notifications/infrastructure/notification-settings-api.server';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name).trim().toLowerCase();
  const user = await createCookieAuthContextProvider().getUser();
  if (!user || user.username.trim().toLowerCase() !== accountName) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const settings = await fetchNotificationSettings(accountName);
  if (!settings) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  return NextResponse.json(settings);
}
