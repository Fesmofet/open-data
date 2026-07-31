import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';

import { HomeI18nToolbar } from '../../../home-i18n-toolbar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    title: messages.settings,
  };
}

export default async function SettingsPage() {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);

  return (
    <div>
      <h1 className="mb-6 font-display text-section text-heading leading-display">
        {messages.settings}
      </h1>
      <HomeI18nToolbar />
    </div>
  );
}
