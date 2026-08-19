import { type NextRequest, NextResponse } from 'next/server';

import { env } from '@/config/env';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export const dynamic = 'force-dynamic';

type ValidateMembersBody = {
  accounts?: string[];
};

/**
 * BFF: preflight channel_member_add for group admins (mute + cap + membership).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ channelId: string }> },
) {
  const user = await createCookieAuthContextProvider().getUser();
  const viewer = user?.username?.trim();
  if (!viewer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { channelId } = await context.params;
  const trimmedChannelId = channelId.trim();
  if (!trimmedChannelId) {
    return NextResponse.json({ error: 'missing channelId' }, { status: 400 });
  }

  let body: ValidateMembersBody;
  try {
    body = (await request.json()) as ValidateMembersBody;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const upstream = await fetch(
    `${base}/query/v1/channels/${encodeURIComponent(trimmedChannelId)}/validate-members`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Viewer': viewer,
      },
      body: JSON.stringify({ accounts }),
      cache: 'no-store',
    },
  );

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';

  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
  });
}
