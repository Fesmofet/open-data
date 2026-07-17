import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { BusinessOffersListPage } from '@/modules/business/presentation/business-offers-list-page';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_offers_title ?? 'Offers' };
}

export default function BusinessOffersPublishedPage() {
  return <BusinessOffersListPage kind="offer" tab="published" />;
}
