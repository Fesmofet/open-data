import { NextResponse } from 'next/server';

import { stopWaivGeneratedReport } from '@/modules/user-wallet/infrastructure/clients/waiv-generated-report.client';

import {
  generatedReportApiErrorResponse,
  requireGeneratedReportSession,
} from '../../require-generated-report-session';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ reportId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const { reportId } = await context.params;
  const result = await stopWaivGeneratedReport(reportId);
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}
