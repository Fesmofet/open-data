import { notFound } from 'next/navigation';

import { BusinessRelationshipDetailClient } from '@/modules/business';
import { fetchOblLedger } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessRelationshipDetailPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { username } = await requireBusinessUser();
  const { account } = await params;
  const counterparty = decodeURIComponent(account);
  const ledger = await fetchOblLedger(username, counterparty);
  if (!ledger) {
    notFound();
  }
  return (
    <BusinessRelationshipDetailClient
      username={username}
      counterparty={counterparty}
      ledger={ledger}
    />
  );
}
