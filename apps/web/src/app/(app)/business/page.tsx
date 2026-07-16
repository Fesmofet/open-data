import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { BusinessOverviewClient } from '@/modules/business';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_title ?? 'Business' };
}

export default async function BusinessOverviewPage() {
  const { username } = await requireBusinessUser();
  return <BusinessOverviewClient username={username} />;
}
