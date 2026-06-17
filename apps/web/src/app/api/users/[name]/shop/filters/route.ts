import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name).trim();
  if (!accountName) {
    return NextResponse.json({ error: 'Missing account name' }, { status: 400 });
  }

  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const url = new URL(`${base}/query/v1/users/${encodeURIComponent(accountName)}/shop/filters`);

  for (const type of request.nextUrl.searchParams.getAll('types')) {
    const trimmed = type.trim();
    if (trimmed) {
      url.searchParams.append('types', trimmed);
    }
  }
  for (const segment of request.nextUrl.searchParams.getAll('categoryPath')) {
    const trimmed = segment.trim();
    if (trimmed) {
      url.searchParams.append('categoryPath', trimmed);
    }
  }
  if (request.nextUrl.searchParams.get('uncategorizedOnly') === 'true') {
    url.searchParams.set('uncategorizedOnly', 'true');
  }
  for (const tag of request.nextUrl.searchParams.getAll('tags')) {
    const trimmed = tag.trim();
    if (trimmed) {
      url.searchParams.append('tags', trimmed);
    }
  }

  const upstream = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  return new NextResponse(text, {
    status: upstream.ok ? 200 : upstream.status,
    headers: { 'Content-Type': contentType },
  });
}
