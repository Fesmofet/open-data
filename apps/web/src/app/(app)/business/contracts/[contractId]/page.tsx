import { notFound } from 'next/navigation';

import { BusinessContractClient } from '@/modules/business';
import { fetchOblContract } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  await requireBusinessUser();
  const { contractId } = await params;
  const contract = await fetchOblContract(decodeURIComponent(contractId));
  if (!contract) {
    notFound();
  }
  return <BusinessContractClient contract={contract} />;
}
