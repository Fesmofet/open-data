import { type NextRequest, NextResponse } from 'next/server';

import { getEngineWalletSummaryQuery } from '@/modules/user-wallet/application/queries/get-engine-wallet-summary.query';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);
  const result = await getEngineWalletSummaryQuery(accountName);

  if (result.error === 'unavailable') {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (result.error === 'invalid_response' || !result.summary) {
    return NextResponse.json({ error: 'invalid_response' }, { status: 502 });
  }

  return NextResponse.json(result.summary);
}
