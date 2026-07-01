import 'server-only';

import { env } from '@/config/env';
import {
  queryApiFetchOutcome,
  QUERY_API_LIVE_INIT,
} from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { getBearerAccessToken } from '@/shared/infrastructure/auth/get-bearer-access-token.server';

import type {
  WaivGeneratedReportCreateRequest,
  WaivGeneratedReportListResponse,
  WaivGeneratedReportRowsResponseApi,
  WaivGeneratedReportSummaryApi,
} from '../../application/dto/waiv-generated-report-api.schema';

const BASE = '/query/v1/wallet/waiv/generated-reports';

type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'unauthorized' | 'unavailable' };

async function authorizedFetch<T>(
  path: string,
  init: RequestInit,
): Promise<AuthResult<T>> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { ok: false, reason: 'unauthorized' };
  }
  const outcome = await queryApiFetchOutcome<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...QUERY_API_LIVE_INIT,
  });
  if (outcome.ok) {
    return { ok: true, data: outcome.data };
  }
  if (outcome.status === 401 || outcome.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  return { ok: false, reason: 'unavailable' };
}

export async function createWaivGeneratedReport(
  body: WaivGeneratedReportCreateRequest,
): Promise<AuthResult<WaivGeneratedReportSummaryApi>> {
  return authorizedFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listWaivGeneratedReports(params?: {
  skip?: number;
  limit?: number;
}): Promise<AuthResult<WaivGeneratedReportListResponse>> {
  const search = new URLSearchParams();
  if (params?.skip != null) {
    search.set('skip', String(params.skip));
  }
  if (params?.limit != null) {
    search.set('limit', String(params.limit));
  }
  const qs = search.toString();
  return authorizedFetch(`${BASE}${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export async function getWaivGeneratedReport(
  reportId: string,
): Promise<AuthResult<WaivGeneratedReportSummaryApi>> {
  return authorizedFetch(`${BASE}/${encodeURIComponent(reportId)}`, { method: 'GET' });
}

export async function listWaivGeneratedReportRows(
  reportId: string,
  params?: { skip?: number; limit?: number },
): Promise<AuthResult<WaivGeneratedReportRowsResponseApi>> {
  const search = new URLSearchParams();
  if (params?.skip != null) {
    search.set('skip', String(params.skip));
  }
  if (params?.limit != null) {
    search.set('limit', String(params.limit));
  }
  const qs = search.toString();
  return authorizedFetch(
    `${BASE}/${encodeURIComponent(reportId)}/rows${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  );
}

export async function stopWaivGeneratedReport(
  reportId: string,
): Promise<AuthResult<WaivGeneratedReportSummaryApi>> {
  return authorizedFetch(`${BASE}/${encodeURIComponent(reportId)}/stop`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteWaivGeneratedReport(
  reportId: string,
): Promise<AuthResult<void>> {
  const token = await getBearerAccessToken();
  if (!token) {
    return { ok: false, reason: 'unauthorized' };
  }
  const base = env.QUERY_API_URL.replace(/\/$/, '');
  const url = `${base}${BASE}/${encodeURIComponent(reportId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ...QUERY_API_LIVE_INIT,
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (res.status === 204 || res.ok) {
    return { ok: true, data: undefined };
  }
  return { ok: false, reason: 'unavailable' };
}

export async function toggleWaivGeneratedReportRow(
  reportId: string,
  operationIndex: number,
  checked: boolean,
): Promise<AuthResult<WaivGeneratedReportSummaryApi>> {
  return authorizedFetch(
    `${BASE}/${encodeURIComponent(reportId)}/rows/${operationIndex}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ checked }),
    },
  );
}
