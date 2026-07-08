import { NextResponse } from 'next/server';

import { buildCurrencyMarketPanel } from '@/modules/currency/application/build-currency-market-panel';

export const dynamic = 'force-dynamic';

export async function GET() {
  const outcome = await buildCurrencyMarketPanel();

  if (!outcome.ok) {
    const status = outcome.error === 'unavailable' ? 503 : 500;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.data);
}
