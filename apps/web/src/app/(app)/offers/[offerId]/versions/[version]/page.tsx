import { notFound } from 'next/navigation';

import { PublicOfferPageClient } from '@/modules/business';
import { fetchOblOffer } from '@/modules/business/infrastructure/clients/obl-offers.server';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export default async function PublicOfferSignPage({
  params,
}: {
  params: Promise<{ offerId: string; version: string }>;
}) {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const { offerId, version } = await params;
  const versionNum = Number.parseInt(version, 10);
  if (!Number.isFinite(versionNum)) {
    notFound();
  }
  const offer = await fetchOblOffer(offerId, versionNum);
  if (!offer || offer.kind !== 'offer') {
    notFound();
  }
  return <PublicOfferPageClient offer={offer} viewer={user?.username ?? null} />;
}
