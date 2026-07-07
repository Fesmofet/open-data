import { type NextRequest, NextResponse } from 'next/server';

import { getEngineDepositAddressQuery } from '@/modules/user-wallet/application/queries/engine-swap.queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);
  const symbol = request.nextUrl.searchParams.get('symbol') ?? '';

  const result = await getEngineDepositAddressQuery(accountName, symbol);
  if (result.error === 'bad_request') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (result.error === 'unavailable') {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'invalid_response' }, { status: 502 });
  }
  return NextResponse.json(result.data);
}
