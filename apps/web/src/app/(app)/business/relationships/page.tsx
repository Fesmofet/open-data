import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { OBL_LIST_PAGE_SIZE } from '@/modules/business/domain/obl-pagination.types';
import { BusinessRelationshipsClient } from '@/modules/business';
import { fetchOblRelationships } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_relationships_title ?? 'Relationships' };
}

export default async function BusinessRelationshipsPage() {
  const { username } = await requireBusinessUser();
  const page = await fetchOblRelationships(username, {
    limit: OBL_LIST_PAGE_SIZE,
    offset: 0,
  });
  return (
    <BusinessRelationshipsClient
      username={username}
      initialPage={page ?? { items: [], hasMore: false }}
    />
  );
}
