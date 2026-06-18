import { type NextRequest, NextResponse } from 'next/server';

import {
  ACTIVITY_DISPLAY_PAGE_SIZE,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';
import { getUserActivityPageQuery } from '@/modules/user-activity/application/queries/get-user-activity-page.query';

export const dynamic = 'force-dynamic';

type ActivityRequestBody = {
  limit?: number;
  cursor?: string;
  filters?: ActivityFilterKey[];
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);

  let body: ActivityRequestBody = {};
  try {
    body = (await request.json()) as ActivityRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const result = await getUserActivityPageQuery(accountName, {
    limit: body.limit ?? ACTIVITY_DISPLAY_PAGE_SIZE,
    cursor: body.cursor,
    filters: body.filters ?? [],
  });

  return NextResponse.json(result);
}
