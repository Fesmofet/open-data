import { type NextRequest, NextResponse } from 'next/server';

import { hiveWalletExemptionRequestSchema } from '@/modules/user-wallet/application/dto/hive-advanced-report-api.schema';
import { postHiveWalletExemption } from '@/modules/user-wallet/infrastructure/clients/hive-advanced-report.client';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await createCookieAuthContextProvider().getUser();
  if (!user?.username) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = hiveWalletExemptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (parsed.data.viewer.trim().toLowerCase() !== user.username.trim().toLowerCase()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await postHiveWalletExemption(parsed.data);
  if (!result) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json(result);
}
