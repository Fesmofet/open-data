import { type NextRequest, NextResponse } from 'next/server';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';
import { getWaivWalletHistoryPageQuery } from '@/modules/user-wallet/application/queries/get-waiv-wallet-history-page.query';

export const dynamic = 'force-dynamic';

type WaivHistoryRequestBody = {
  limit?: number;
  cursor?: string;
  showRewards?: boolean;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);

  let body: WaivHistoryRequestBody = {};
  try {
    body = (await request.json()) as WaivHistoryRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const result = await getWaivWalletHistoryPageQuery(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
    showRewards: body.showRewards ?? false,
  });

  return NextResponse.json(result);
}
