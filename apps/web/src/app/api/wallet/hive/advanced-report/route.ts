import { type NextRequest, NextResponse } from 'next/server';

import { hiveAdvancedReportRequestSchema } from '@/modules/user-wallet/application/dto/hive-advanced-report-api.schema';
import { getHiveAdvancedReportQuery } from '@/modules/user-wallet/application/queries/get-hive-advanced-report.query';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await createCookieAuthContextProvider().getUser();
  if (!user?.username) {
    return NextResponse.json({ report: null, error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = hiveAdvancedReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (
    parsed.data.viewer &&
    parsed.data.viewer.trim().toLowerCase() !== user.username.trim().toLowerCase()
  ) {
    return NextResponse.json({ report: null, error: 'unauthorized' }, { status: 403 });
  }

  const result = await getHiveAdvancedReportQuery(parsed.data);
  if (result.error === 'unauthorized') {
    return NextResponse.json(result, { status: 401 });
  }
  return NextResponse.json(result);
}
