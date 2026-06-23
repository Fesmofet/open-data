import { type NextRequest, NextResponse } from 'next/server';

import { hiveAdvancedReportRequestSchema } from '@/modules/user-wallet/application/dto/hive-advanced-report-api.schema';
import { getHiveAdvancedReportQuery } from '@/modules/user-wallet/application/queries/get-hive-advanced-report.query';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

  const result = await getHiveAdvancedReportQuery(parsed.data);
  return NextResponse.json(result);
}
