import { NextResponse } from 'next/server';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

type GeneratedReportSession =
  | { ok: true; username: string }
  | { ok: false; response: NextResponse };

export async function requireGeneratedReportSession(): Promise<GeneratedReportSession> {
  const user = await createCookieAuthContextProvider().getUser();
  if (!user?.username?.trim()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, username: user.username.trim().toLowerCase() };
}

export function generatedReportApiErrorResponse(
  reason: 'unauthorized' | 'unavailable',
): NextResponse {
  return NextResponse.json(
    { error: reason },
    { status: reason === 'unauthorized' ? 401 : 503 },
  );
}
