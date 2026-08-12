import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { HasRedirectPanel } from '@/modules/auth/presentation/components/has-redirect-panel';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    title: messages.has_redirect_title ?? 'Open Hive Keychain',
    robots: { index: false, follow: false },
  };
}

export default function HasRedirectPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-container-narrow rounded-card-lg border border-border bg-surface p-card-padding shadow-card-float">
        <HasRedirectPanel />
      </div>
    </div>
  );
}
