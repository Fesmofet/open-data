'use server';

import { queryApiDraftsFetch } from '@/modules/editor/infrastructure/query-api-drafts.server';
import type { Result } from '@/shared/domain/result';

import type { OblOfferDraftView } from '../clients/obl-drafts.server';

function oblDraftsBase(author: string) {
  return `/query/v1/users/${encodeURIComponent(author)}/obl-drafts`;
}

export async function listOblDraftsAction(
  author: string,
): Promise<Result<OblOfferDraftView[], import('@/modules/editor/infrastructure/query-api-drafts.server').QueryApiDraftError>> {
  return queryApiDraftsFetch<OblOfferDraftView[]>(oblDraftsBase(author), {
    method: 'GET',
  });
}

export async function createOblDraftAction(
  author: string,
  body: {
    draftId?: string;
    kind: 'offer' | 'request';
    fields?: Record<string, unknown>;
    legalText?: string | null;
  },
): Promise<Result<OblOfferDraftView, import('@/modules/editor/infrastructure/query-api-drafts.server').QueryApiDraftError>> {
  return queryApiDraftsFetch<OblOfferDraftView>(oblDraftsBase(author), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function patchOblDraftAction(
  author: string,
  draftId: string,
  body: {
    kind?: 'offer' | 'request';
    fields?: Record<string, unknown>;
    legalText?: string | null;
  },
): Promise<Result<OblOfferDraftView, import('@/modules/editor/infrastructure/query-api-drafts.server').QueryApiDraftError>> {
  return queryApiDraftsFetch<OblOfferDraftView>(
    `${oblDraftsBase(author)}?draftId=${encodeURIComponent(draftId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function deleteOblDraftAction(
  author: string,
  draftId: string,
): Promise<Result<void, import('@/modules/editor/infrastructure/query-api-drafts.server').QueryApiDraftError>> {
  return queryApiDraftsFetch<void>(
    `${oblDraftsBase(author)}?draftId=${encodeURIComponent(draftId)}`,
    { method: 'DELETE' },
  );
}
