import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { OBL_LIST_PAGE_SIZE } from '@/modules/business/domain/obl-pagination.types';
import { parseArbitrationStatus } from '@/modules/business/domain/arbitration-status-url';
import { BusinessArbitrationClient } from '@/modules/business/presentation/components/business-arbitration-client';
import { fetchOblArbitration } from '@/modules/business/infrastructure/clients/obl-arbitration.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return { title: messages.business_arbitration_title ?? 'Arbitration' };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BusinessArbitrationPage({ searchParams }: PageProps) {
  const { username } = await requireBusinessUser();
  const status = parseArbitrationStatus(await searchParams);
  const page = await fetchOblArbitration(username, {
    status,
    limit: OBL_LIST_PAGE_SIZE,
  });
  return (
    <BusinessArbitrationClient
      username={username}
      status={status}
      initialPage={page ?? { items: [], hasMore: false, nextCursor: null }}
    />
  );
}
