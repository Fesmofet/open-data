'use client';

import type { OblInvoiceDetailApiResponse } from './obl-ledger.server';

export async function fetchOblInvoiceDetailClient(
  invoiceId: string,
): Promise<OblInvoiceDetailApiResponse> {
  const res = await fetch(`/api/business/invoices/${encodeURIComponent(invoiceId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`invoice detail ${res.status}`);
  }
  return res.json() as Promise<OblInvoiceDetailApiResponse>;
}
