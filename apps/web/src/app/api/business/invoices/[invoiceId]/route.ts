import { NextResponse } from 'next/server';

import { env } from '@/config/env';

type RouteContext = { params: Promise<{ invoiceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { invoiceId } = await context.params;
  if (!invoiceId?.trim()) {
    return NextResponse.json({ message: 'invoiceId required' }, { status: 400 });
  }
  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const res = await fetch(
    `${base}/query/v1/obl/invoices/${encodeURIComponent(invoiceId)}`,
    { cache: 'no-store' },
  );
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
