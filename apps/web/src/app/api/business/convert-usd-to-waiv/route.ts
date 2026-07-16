import { NextResponse } from 'next/server';

import { env } from '@/config/env';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amountUsd = url.searchParams.get('amountUsd');
  if (!amountUsd) {
    return NextResponse.json({ message: 'amountUsd required' }, { status: 400 });
  }
  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const res = await fetch(
    `${base}/query/v1/obl/convert/usd-to-waiv?amountUsd=${encodeURIComponent(amountUsd)}`,
    { cache: 'no-store' },
  );
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
