import { type NextRequest, NextResponse } from 'next/server';

import { postEngineSwapQuoteQuery } from '@/modules/user-wallet/application/queries/engine-swap.queries';

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

  const result = await postEngineSwapQuoteQuery(accountName, {
    fromSymbol: String(body.fromSymbol ?? ''),
    toSymbol: String(body.toSymbol ?? ''),
    amountIn: String(body.amountIn ?? ''),
    direction:
      body.direction === 'exactOutput' ? 'exactOutput' : 'exactInput',
    slippage:
      typeof body.slippage === 'number' ? body.slippage : undefined,
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
