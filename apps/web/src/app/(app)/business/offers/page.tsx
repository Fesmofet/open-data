import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { OBL_LIST_PAGE_SIZE } from '@/modules/business/domain/obl-pagination.types';
import { parsePublicOffersPageState } from '@/modules/business/domain/public-offers-url';
import { PublicOffersListClient } from '@/modules/business/presentation/components/public-offers-list-client';
import { searchOblOffers } from '@/modules/business/infrastructure/clients/obl-offers.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_public_offers_title ?? 'Offers' };
}

export default async function BusinessDiscoverOffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parsePublicOffersPageState(sp);
  const page = await searchOblOffers({
    kind: 'offer',
    author: filters.author || undefined,
    q: filters.q || undefined,
    limit: OBL_LIST_PAGE_SIZE,
  });
  return (
    <PublicOffersListClient
      initialPage={page ?? { items: [], hasMore: false }}
      kind="offer"
      filters={filters}
    />
  );
}
