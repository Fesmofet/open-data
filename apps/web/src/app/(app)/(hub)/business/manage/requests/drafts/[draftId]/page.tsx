import { notFound, redirect } from 'next/navigation';

import { BusinessOfferEditorClient } from '@/modules/business';
import { businessRoutes } from '@/modules/business/domain/routes';
import { fetchOblDraftOne } from '@/modules/business/infrastructure/clients/obl-drafts.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessRequestDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { username } = await requireBusinessUser();
  const { draftId } = await params;
  const draft = await fetchOblDraftOne(username, draftId);
  if (!draft) {
    notFound();
  }
  if (draft.kind === 'offer') {
    redirect(businessRoutes.offerDraft('offer', draftId));
  }
  return <BusinessOfferEditorClient username={username} draft={draft} />;
}
