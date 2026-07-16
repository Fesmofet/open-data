import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { BusinessRelationshipDetailClient } from '@/modules/business';
import { parseRelationshipTab } from '@/modules/business/domain/relationship-tab-url';
import { loadRelationshipDetailInitial } from '@/modules/business/infrastructure/actions/load-more-obl.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessRelationshipDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username } = await requireBusinessUser();
  const { account } = await params;
  const resolvedSearchParams = await searchParams;
  const counterparty = decodeURIComponent(account);
  const initialTab = parseRelationshipTab(resolvedSearchParams);
  const data = await loadRelationshipDetailInitial(username, counterparty, initialTab);
  if (!data) {
    notFound();
  }
  return (
    <Suspense fallback={null}>
      <BusinessRelationshipDetailClient
        username={username}
        counterparty={counterparty}
        balance={data.balance}
        initialTab={initialTab}
        initialTabPages={data.tabPages}
        contractLabels={data.contractLabels}
      />
    </Suspense>
  );
}
