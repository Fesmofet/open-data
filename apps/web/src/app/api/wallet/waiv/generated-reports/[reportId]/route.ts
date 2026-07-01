import { type NextRequest, NextResponse } from 'next/server';

import {
  deleteWaivGeneratedReport,
  getWaivGeneratedReport,
} from '@/modules/user-wallet/infrastructure/clients/waiv-generated-report.client';

import {
  generatedReportApiErrorResponse,
  requireGeneratedReportSession,
} from '../require-generated-report-session';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ reportId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const { reportId } = await context.params;
  const result = await getWaivGeneratedReport(reportId);
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const { reportId } = await context.params;
  const result = await deleteWaivGeneratedReport(reportId);
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return new NextResponse(null, { status: 204 });
}
