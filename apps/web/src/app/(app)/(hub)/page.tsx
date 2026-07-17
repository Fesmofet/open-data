import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { HomeAgentComposerStub } from '@/modules/home';
import { buildHomeMetadata } from '@/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return buildHomeMetadata({ locale, messages });
}

export default function Index() {
  return (
    <main className="flex min-h-[min(70dvh,36rem)] flex-col items-center justify-center px-gutter py-section-y sm:px-gutter-sm">
      <HomeAgentComposerStub />
    </main>
  );
}
