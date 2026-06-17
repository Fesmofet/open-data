import 'server-only';

import { env } from '@/config/env';
import {
  QUERY_API_LIVE_INIT,
  queryApiFetch,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

import {
  relatedAlbumListResponseSchema,
  relatedAlbumPreviewResponseSchema,
  type RelatedAlbumFetchResult,
  type RelatedAlbumListView,
  type RelatedAlbumPreviewView,
} from '../domain/related-album.types';

function previewPath(objectId: string, limit?: number): string {
  const base = `/query/v1/objects/${encodeURIComponent(objectId)}/gallery/related/preview`;
  if (limit == null) {
    return base;
  }
  return `${base}?limit=${encodeURIComponent(String(limit))}`;
}

function listPath(
  objectId: string,
  options?: { limit?: number; cursor?: string | null },
): string {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }
  const qs = params.toString();
  const base = `/query/v1/objects/${encodeURIComponent(objectId)}/gallery/related`;
  return qs ? `${base}?${qs}` : base;
}

function classifyCountResult<T extends { count: number }>(
  data: T,
): RelatedAlbumFetchResult<T> {
  return data.count > 0 ? { status: 'ok', data } : { status: 'empty', data };
}

async function fetchRelatedAlbumLiveJson(path: string): Promise<unknown | null> {
  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  try {
    const res = await fetch(url, QUERY_API_LIVE_INIT);
    if (res.status === 404 || !res.ok) {
      return null;
    }
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function fetchObjectRelatedAlbumPreviewLive(
  objectId: string,
): Promise<RelatedAlbumFetchResult<RelatedAlbumPreviewView>> {
  const raw = await fetchRelatedAlbumLiveJson(previewPath(objectId));
  if (raw == null) {
    return { status: 'error' };
  }
  const parsed = relatedAlbumPreviewResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error' };
  }
  return classifyCountResult(parsed.data);
}

export async function fetchObjectRelatedAlbumPageLive(
  objectId: string,
  options?: { limit?: number; cursor?: string | null },
): Promise<RelatedAlbumFetchResult<RelatedAlbumListView>> {
  const raw = await fetchRelatedAlbumLiveJson(
    listPath(objectId, { limit: options?.limit, cursor: options?.cursor }),
  );
  if (raw == null) {
    return { status: 'error' };
  }
  const parsed = relatedAlbumListResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error' };
  }
  return classifyCountResult(parsed.data);
}

export async function fetchObjectRelatedAlbumPreview(
  objectId: string,
  options?: { locale?: string; limit?: number },
): Promise<RelatedAlbumPreviewView | null> {
  const headers: Record<string, string> = {};
  if (options?.locale) {
    headers['Accept-Language'] = options.locale;
    headers['X-Locale'] = options.locale;
  }
  const raw = await queryApiFetch<unknown>(previewPath(objectId, options?.limit), {
    headers,
  });
  if (raw == null) {
    return null;
  }
  const parsed = relatedAlbumPreviewResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function fetchObjectRelatedAlbumPage(
  objectId: string,
  options?: { locale?: string; limit?: number; cursor?: string | null },
): Promise<RelatedAlbumListView | null> {
  const headers: Record<string, string> = {};
  if (options?.locale) {
    headers['Accept-Language'] = options.locale;
    headers['X-Locale'] = options.locale;
  }
  const raw = await queryApiFetch<unknown>(
    listPath(objectId, { limit: options?.limit, cursor: options?.cursor }),
    { headers },
  );
  if (raw == null) {
    return null;
  }
  const parsed = relatedAlbumListResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
