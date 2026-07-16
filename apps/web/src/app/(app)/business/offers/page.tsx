import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { BusinessOffersListClient } from '@/modules/business';
import { fetchOblDraftList } from '@/modules/business/infrastructure/clients/obl-drafts.server';
import { searchOblOffers } from '@/modules/business/infrastructure/clients/obl-offers.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_offers_title ?? 'Offers' };
}

export default async function BusinessOffersPage() {
  const { username } = await requireBusinessUser();
  const [drafts, published] = await Promise.all([
    fetchOblDraftList(username),
    searchOblOffers({ author: username, limit: 100 }),
  ]);
  return (
    <BusinessOffersListClient
      username={username}
      drafts={drafts}
      published={published ?? []}
    />
  );
}
