import { redirect } from 'next/navigation';

import { businessRoutes } from '@/modules/business/domain/routes';

export default function LegacyPublicOffersRedirect() {
  redirect(businessRoutes.discoverOffers);
}
