import { type NextRequest, NextResponse } from 'next/server';

import { waivGeneratedReportToggleRowRequestSchema } from '@/modules/user-wallet/application/dto/waiv-generated-report-api.schema';
import { toggleWaivGeneratedReportRow } from '@/modules/user-wallet/infrastructure/clients/waiv-generated-report.client';

import {
  generatedReportApiErrorResponse,
  requireGeneratedReportSession,
} from '../../../require-generated-report-session';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ reportId: string; operationIndex: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireGeneratedReportSession();
  if (!session.ok) {
    return session.response;
  }
  const { reportId, operationIndex: operationIndexRaw } = await context.params;
  const operationIndex = Number(operationIndexRaw);
  if (!Number.isInteger(operationIndex)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const parsed = waivGeneratedReportToggleRowRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const result = await toggleWaivGeneratedReportRow(
    reportId,
    operationIndex,
    parsed.data.checked,
  );
  if (!result.ok) {
    return generatedReportApiErrorResponse(result.reason);
  }
  return NextResponse.json(result.data);
}
