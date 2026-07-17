import { notFound } from 'next/navigation';

import { PublicOfferPageClient } from '@/modules/business';
import { fetchOblOffer } from '@/modules/business/infrastructure/clients/obl-offers.server';
import { resolveOfferAlreadySigned } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessOfferVersionPage({
  params,
}: {
  params: Promise<{ offerId: string; version: string }>;
}) {
  const { username } = await requireBusinessUser();
  const { offerId, version } = await params;
  const versionNum = Number.parseInt(version, 10);
  if (!Number.isFinite(versionNum)) {
    notFound();
  }
  const offer = await fetchOblOffer(offerId, versionNum);
  if (!offer) {
    notFound();
  }
  const alreadySigned = await resolveOfferAlreadySigned(username, offerId, offer.author);
  return (
    <PublicOfferPageClient
      offer={offer}
      viewer={username}
      alreadySigned={alreadySigned}
    />
  );
}
