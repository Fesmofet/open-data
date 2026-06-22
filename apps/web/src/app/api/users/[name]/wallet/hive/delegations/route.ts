import { type NextRequest, NextResponse } from 'next/server';

import { getHiveHpDelegationsQuery } from '@/modules/user-wallet/application/queries/get-hive-hp-delegations.query';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);
  const result = await getHiveHpDelegationsQuery(accountName);
  if (!result) {
    return NextResponse.json({ error: 'unavailable' }, { status: 404 });
  }
  return NextResponse.json(result);
}
