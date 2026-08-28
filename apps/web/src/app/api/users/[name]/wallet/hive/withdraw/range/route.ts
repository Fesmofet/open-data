import { type NextRequest, NextResponse } from 'next/server';

import { getHiveChangellyWithdrawRangeQuery } from '@/modules/user-wallet/application/queries/hive-changelly-withdraw.queries';
import { normalizeHiveChangellyOutputCoin } from '@/modules/user-wallet/domain/hive-changelly-withdraw.constants';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);
  const outputCoinType = normalizeHiveChangellyOutputCoin(
    _request.nextUrl.searchParams.get('outputCoinType') ?? '',
  );
  if (!outputCoinType) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const result = await getHiveChangellyWithdrawRangeQuery(accountName, outputCoinType);
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
