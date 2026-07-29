import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
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

  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);

  return (
    <main className="mx-auto w-full max-w-container-content px-gutter pt-section-y pb-section-y sm:px-gutter-sm">
      <h1 className="font-display text-section font-weight-display text-heading leading-display">
        {messages.notification_settings}
      </h1>
    </main>
  );
}
