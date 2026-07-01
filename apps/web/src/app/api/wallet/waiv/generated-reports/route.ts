import { type NextRequest, NextResponse } from 'next/server';

import { waivGeneratedReportCreateRequestSchema } from '@/modules/user-wallet/application/dto/waiv-generated-report-api.schema';
import {
  createWaivGeneratedReport,
  listWaivGeneratedReports,
} from '@/modules/user-wallet/infrastructure/clients/waiv-generated-report.client';

import {
  generatedReportApiErrorResponse,
  requireGeneratedReportSession,
} from './require-generated-report-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const skip = Number(request.nextUrl.searchParams.get('skip') ?? 0);
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 20);
  const result = await listWaivGeneratedReports({ skip, limit });
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const parsed = waivGeneratedReportCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const result = await createWaivGeneratedReport(parsed.data);
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}
