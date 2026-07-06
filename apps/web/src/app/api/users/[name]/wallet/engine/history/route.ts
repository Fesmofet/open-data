import { type NextRequest, NextResponse } from 'next/server';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';
import { getEngineWalletHistoryPageQuery } from '@/modules/user-wallet/application/queries/get-engine-wallet-history-page.query';

export const dynamic = 'force-dynamic';

type EngineHistoryRequestBody = {
  limit?: number;
  cursor?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);

  let body: EngineHistoryRequestBody = {};
  try {
    body = (await request.json()) as EngineHistoryRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const result = await getEngineWalletHistoryPageQuery(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
  });

  return NextResponse.json(result);
}
