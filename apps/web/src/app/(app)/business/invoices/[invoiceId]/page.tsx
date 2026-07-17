import { notFound } from 'next/navigation';

import { BusinessInvoiceClient } from '@/modules/business';
import { fetchOblInvoice } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  await requireBusinessUser();
  const { invoiceId } = await params;
  const detail = await fetchOblInvoice(decodeURIComponent(invoiceId));
  if (!detail) {
    notFound();
  }
  return <BusinessInvoiceClient detail={detail} />;
}
