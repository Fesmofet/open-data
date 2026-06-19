import { type NextRequest, NextResponse } from 'next/server';

import { getEngineTokenDelegationsQuery } from '@/modules/user-wallet/application/queries/get-engine-token-delegations.query';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string; symbol: string }> },
) {
  const { name, symbol } = await context.params;
  const accountName = decodeURIComponent(name);
  const tokenSymbol = decodeURIComponent(symbol);
  const result = await getEngineTokenDelegationsQuery(accountName, tokenSymbol);
  if (!result) {
    return NextResponse.json({ error: 'unavailable' }, { status: 404 });
  }
  return NextResponse.json(result);
}
