import 'server-only';

import {
  queryApiFetch,
  queryApiFetchLive,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

export type OblOfferApiRow = {
  offer_id: string;
  version: number;
  kind: 'offer' | 'request';
  author: string;
  name: string;
  description: string | null;
  tags: string[];
  service_ref: string | null;
  legal_ref: string | null;
  terms: unknown;
  dispute_rule: 'client' | 'provider' | 'arbiter';
  arbiter: string | null;
  status: 'active' | 'retired';
  created_event_seq: string;
  transaction_id: string;
};

export async function searchOblOffers(params: {
  q?: string;
  kind?: 'offer' | 'request';
  author?: string;
  status?: 'active' | 'retired' | 'all';
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.kind) q.set('kind', params.kind);
  if (params.author) q.set('author', params.author);
  if (params.status) q.set('status', params.status);
  if (params.limit !== undefined) q.set('limit', String(params.limit));
  if (params.offset !== undefined) q.set('offset', String(params.offset));
  const qs = q.toString();
  return queryApiFetch<OblOfferApiRow[]>(
    `/query/v1/obl/offers/search${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchOblOffer(offerId: string, version?: number) {
  const q =
    version !== undefined ? `?version=${encodeURIComponent(String(version))}` : '';
  return queryApiFetch<OblOfferApiRow>(
    `/query/v1/obl/offers/${encodeURIComponent(offerId)}${q}`,
  );
}

export async function fetchOblOfferLive(offerId: string, version?: number) {
  const q =
    version !== undefined ? `?version=${encodeURIComponent(String(version))}` : '';
  return queryApiFetchLive<OblOfferApiRow>(
    `/query/v1/obl/offers/${encodeURIComponent(offerId)}${q}`,
  );
}
