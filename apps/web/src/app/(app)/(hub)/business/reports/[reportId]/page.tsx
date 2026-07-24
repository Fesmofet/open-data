import { notFound } from 'next/navigation';

import { BusinessReportClient } from '@/modules/business';
import { fetchOblReport } from '@/modules/business/infrastructure/clients/obl-ledger.server';
import { requireBusinessUser } from '@/modules/business/infrastructure/require-business-user.server';

export default async function BusinessReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireBusinessUser();
  const { reportId } = await params;
  const detail = await fetchOblReport(decodeURIComponent(reportId));
  if (!detail) {
    notFound();
  }
  return <BusinessReportClient detail={detail} />;
}
