import { notFound, redirect } from 'next/navigation';

import { BusinessOfferEditorClient } from '@/modules/business';
import { businessRoutes } from '@/modules/business/domain/routes';
import { fetchOblDraftOne } from '@/modules/business/infrastructure/clients/obl-drafts.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessOfferDraftPage({
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
  if (draft.kind === 'request') {
    redirect(businessRoutes.offerDraft('request', draftId));
  }
  return <BusinessOfferEditorClient username={username} draft={draft} />;
}
