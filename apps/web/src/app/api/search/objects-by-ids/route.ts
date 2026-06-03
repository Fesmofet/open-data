import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export const dynamic = 'force-dynamic';

/**
 * BFF: batch object card display — proxies to query-api `POST /query/v1/search/objects-by-ids`.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const objectIds = (body as { object_ids?: unknown })?.object_ids;
  if (!Array.isArray(objectIds) || objectIds.length === 0) {
    return NextResponse.json({ error: 'object_ids must be a non-empty array' }, { status: 400 });
  }

  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const url = `${base}/query/v1/search/objects-by-ids`;

  const [locale, user] = await Promise.all([
    getRequestLocale(),
    createCookieAuthContextProvider().getUser(),
  ]);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': locale,
    'X-Locale': locale,
  };

  const viewer = user?.username?.trim();
  if (viewer) {
    headers['X-Viewer'] = viewer;
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ object_ids: objectIds }),
    cache: 'no-store',
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';

  if (!upstream.ok) {
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': contentType },
    });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { 'Content-Type': contentType },
  });
}
