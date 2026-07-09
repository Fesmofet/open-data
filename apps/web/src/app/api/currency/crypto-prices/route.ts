import { NextResponse } from 'next/server';

const COINGECKO_IDS = ['bitcoin', 'ethereum', 'litecoin'] as const;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS.join(',')}&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return NextResponse.json({ prices: {} }, { status: 503 });
    }

    const payload = (await response.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};

    for (const id of COINGECKO_IDS) {
      const usd = payload[id]?.usd;
      if (typeof usd === 'number' && Number.isFinite(usd)) {
        prices[id] = usd;
      }
    }

    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: {} }, { status: 503 });
  }
}
