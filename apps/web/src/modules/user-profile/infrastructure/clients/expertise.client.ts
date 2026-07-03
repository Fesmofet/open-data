import 'server-only';

import type {
  ExpertiseCountersResponse,
  ExpertiseObjectsPage,
  ExpertiseScope,
} from '../../domain/types/expertise';
import {
  expertiseCountersResponseSchema,
  expertiseObjectsPageSchema,
} from '../../domain/types/expertise';
import { queryApiFetch } from './query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

function localeHeaders(locale: string): Record<string, string> {
  return {
    'X-Locale': locale,
    'Accept-Language': locale,
  };
}

function viewerHeaders(viewer?: string | null): Record<string, string> | undefined {
  const v = viewer?.trim();
  if (!v) {
    return undefined;
  }
  return { 'X-Viewer': v };
}

export async function fetchExpertiseCounters(
  username: string,
): Promise<ExpertiseCountersResponse | null> {
  const name = username.trim();
  if (name.length === 0) {
    return null;
  }
  const path = `/query/v1/users/${encodeURIComponent(name)}/expertise/counters`;
  const raw = await queryApiFetch<unknown>(path, {
    cacheTags: [queryApiCacheTags.userExpertiseCounters(name)],
  });
  if (raw == null) {
    return null;
  }
  const parsed = expertiseCountersResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[fetchExpertiseCounters] unexpected response', parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

export async function fetchExpertiseObjects(
  username: string,
  params: { scope: ExpertiseScope; skip?: number; limit?: number },
  init: { locale: string; viewer?: string | null },
): Promise<ExpertiseObjectsPage | null> {
  const name = username.trim();
  if (name.length === 0) {
    return null;
  }
  const sp = new URLSearchParams();
  sp.set('scope', params.scope);
  if (params.skip != null) {
    sp.set('skip', String(params.skip));
  }
  if (params.limit != null) {
    sp.set('limit', String(params.limit));
  }
  const path = `/query/v1/users/${encodeURIComponent(name)}/expertise/objects?${sp.toString()}`;
  const raw = await queryApiFetch<unknown>(path, {
    headers: {
      ...localeHeaders(init.locale),
      ...viewerHeaders(init.viewer ?? null),
    },
    cacheTags: [queryApiCacheTags.userExpertise(name, params.scope)],
  });
  if (raw == null) {
    return null;
  }
  const parsed = expertiseObjectsPageSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[fetchExpertiseObjects] unexpected response', parsed.error.flatten());
    return null;
  }
  return parsed.data;
}
