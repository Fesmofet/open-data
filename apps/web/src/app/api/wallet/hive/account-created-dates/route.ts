import { type NextRequest, NextResponse } from 'next/server';

import { hiveAccountCreatedDatesRequestSchema } from '@/modules/user-wallet/application/dto/hive-account-created-dates-api.schema';
import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { HiveAccountCreatedDatesResponseApi } from '@/modules/user-wallet/application/dto/hive-account-created-dates-api.schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = hiveAccountCreatedDatesRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const outcome = await queryApiFetchOutcome<HiveAccountCreatedDatesResponseApi>(
    '/query/v1/wallet/hive/account-created-dates',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      ...QUERY_API_LIVE_INIT,
    },
  );

  if (!outcome.ok) {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }

  return NextResponse.json(outcome.data);
}
