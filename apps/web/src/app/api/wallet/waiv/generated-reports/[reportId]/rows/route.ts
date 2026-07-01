import { type NextRequest, NextResponse } from 'next/server';

import { WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE } from '@opden-data-layer/core/waiv-advanced-report';

import { listWaivGeneratedReportRows } from '@/modules/user-wallet/infrastructure/clients/waiv-generated-report.client';

import {
  generatedReportApiErrorResponse,
  requireGeneratedReportSession,
} from '../../require-generated-report-session';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ reportId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const { reportId } = await context.params;
  const skip = Number(request.nextUrl.searchParams.get('skip') ?? 0);
  const limit = Number(
    request.nextUrl.searchParams.get('limit') ?? WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
  );
  const result = await listWaivGeneratedReportRows(reportId, { skip, limit });
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}
