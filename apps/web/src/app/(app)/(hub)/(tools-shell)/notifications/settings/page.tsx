import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getNotificationsTelegramBotUrl, getNotificationsTelegramBotUsername } from '@/config/get-notifications-telegram-bot';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { NotificationSettingsPageClient } from '@/modules/notifications';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    title: messages.notification_settings,
  };
}

export default async function NotificationSettingsPage() {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  if (!user) {
    redirect('/');
  }

  return (
    <NotificationSettingsPageClient
      username={user.username}
      telegramBotUsername={getNotificationsTelegramBotUsername()}
      telegramBotUrl={getNotificationsTelegramBotUrl()}
    />
  );
}
