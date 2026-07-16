import 'server-only';

import { queryApiDraftsFetch } from '@/modules/editor/infrastructure/query-api-drafts.server';

export type OblOfferDraftView = {
  draftId: string;
  author: string;
  kind: 'offer' | 'request';
  fields: Record<string, unknown>;
  legalText: string | null;
  lastUpdated: number;
};

function oblDraftsPath(author: string, query: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v) {
      q.set(k, v);
    }
  }
  const qs = q.toString();
  return `/query/v1/users/${encodeURIComponent(author)}/obl-drafts${qs ? `?${qs}` : ''}`;
}

export async function fetchOblDraftList(author: string): Promise<OblOfferDraftView[]> {
  const result = await queryApiDraftsFetch<OblOfferDraftView[]>(oblDraftsPath(author), {
    method: 'GET',
  });
  return result.ok ? result.value : [];
}

export async function fetchOblDraftOne(
  author: string,
  draftId: string,
): Promise<OblOfferDraftView | null> {
  const result = await queryApiDraftsFetch<OblOfferDraftView>(
    `/query/v1/users/${encodeURIComponent(author)}/obl-drafts/one?draftId=${encodeURIComponent(draftId)}`,
    { method: 'GET' },
  );
  return result.ok ? result.value : null;
}
