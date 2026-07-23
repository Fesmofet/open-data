import type { Metadata } from 'next';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { OBL_LIST_PAGE_SIZE } from '@/modules/business/domain/obl-pagination.types';
import { parseDisputeResolutionStatus } from '@/modules/business/domain/dispute-resolution-status-url';
import { BusinessDisputeResolutionClient } from '@/modules/business/presentation/components/business-dispute-resolution-client';
import { fetchOblDisputeResolution } from '@/modules/business/infrastructure/clients/obl-dispute-resolution.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    title: messages.business_dispute_resolution_title ?? 'Dispute resolution',
  };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BusinessDisputeResolutionPage({ searchParams }: PageProps) {
  const { username } = await requireBusinessUser();
  const status = parseDisputeResolutionStatus(await searchParams);
  const page = await fetchOblDisputeResolution(username, {
    status,
    limit: OBL_LIST_PAGE_SIZE,
  });
  return (
    <BusinessDisputeResolutionClient
      username={username}
      status={status}
      initialPage={page ?? { items: [], hasMore: false, nextCursor: null }}
    />
  );
}
