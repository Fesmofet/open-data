import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
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
  const rows = await fetchOblRelationships(username);
  return <BusinessRelationshipsClient username={username} rows={rows ?? []} />;
}
