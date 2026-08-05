import { type NextRequest, NextResponse } from 'next/server';

import { postEngineWithdrawQuoteQuery } from '@/modules/user-wallet/application/queries/engine-swap.queries';
import { isDisabledEngineWithdrawPair } from '@/modules/user-wallet/domain/filter-engine-withdraw-list';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const accountName = decodeURIComponent(name);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const inputSymbol = String(body.inputSymbol ?? 'WAIV');
  const outputSymbol = String(body.outputSymbol ?? '');

  if (!outputSymbol || isDisabledEngineWithdrawPair(inputSymbol, outputSymbol)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const result = await postEngineWithdrawQuoteQuery(accountName, {
    inputSymbol,
    outputSymbol,
    quantity: String(body.quantity ?? ''),
    address: body.address ? String(body.address) : undefined,
    previewOnly: body.previewOnly === true,
  });

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
