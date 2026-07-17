import { redirect } from 'next/navigation';

import { businessRoutes } from '@/modules/business/domain/routes';
import { createOblDraftAction } from '@/modules/business/infrastructure/actions/obl-drafts.actions';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessOffersNewPage() {
  const { username } = await requireBusinessUser();
  const result = await createOblDraftAction(username, {
    kind: 'offer',
    fields: { name: '' },
  });
  if (result.ok) {
    redirect(businessRoutes.offerDraft('offer', result.value.draftId));
  }
  redirect(businessRoutes.manageOffers);
}
