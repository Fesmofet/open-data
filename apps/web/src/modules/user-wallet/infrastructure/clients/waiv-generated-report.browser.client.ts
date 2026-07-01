import type {
  WaivGeneratedReportCreateRequest,
  WaivGeneratedReportListResponse,
  WaivGeneratedReportRowsResponseApi,
  WaivGeneratedReportSummaryApi,
} from '../../application/dto/waiv-generated-report-api.schema';

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function createWaivGeneratedReportClient(
  body: WaivGeneratedReportCreateRequest,
): Promise<
  | { ok: true; data: WaivGeneratedReportSummaryApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const response = await fetch('/api/wallet/waiv/generated-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function listWaivGeneratedReportsClient(params?: {
  skip?: number;
  limit?: number;
}): Promise<
  | { ok: true; data: WaivGeneratedReportListResponse }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const search = new URLSearchParams();
  if (params?.skip != null) {
    search.set('skip', String(params.skip));
  }
  if (params?.limit != null) {
    search.set('limit', String(params.limit));
  }
  const qs = search.toString();
  const response = await fetch(
    `/api/wallet/waiv/generated-reports${qs ? `?${qs}` : ''}`,
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function getWaivGeneratedReportClient(
  reportId: string,
): Promise<
  | { ok: true; data: WaivGeneratedReportSummaryApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const response = await fetch(
    `/api/wallet/waiv/generated-reports/${encodeURIComponent(reportId)}`,
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function listWaivGeneratedReportRowsClient(
  reportId: string,
  params?: { skip?: number; limit?: number },
): Promise<
  | { ok: true; data: WaivGeneratedReportRowsResponseApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const search = new URLSearchParams();
  if (params?.skip != null) {
    search.set('skip', String(params.skip));
  }
  if (params?.limit != null) {
    search.set('limit', String(params.limit));
  }
  const qs = search.toString();
  const response = await fetch(
    `/api/wallet/waiv/generated-reports/${encodeURIComponent(reportId)}/rows${qs ? `?${qs}` : ''}`,
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function stopWaivGeneratedReportClient(
  reportId: string,
): Promise<
  | { ok: true; data: WaivGeneratedReportSummaryApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const response = await fetch(
    `/api/wallet/waiv/generated-reports/${encodeURIComponent(reportId)}/stop`,
    { method: 'POST' },
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function toggleWaivGeneratedReportRowClient(
  reportId: string,
  operationIndex: number,
  checked: boolean,
): Promise<
  | { ok: true; data: WaivGeneratedReportSummaryApi }
  | { ok: false; reason: 'unauthorized' | 'unavailable' }
> {
  const response = await fetch(
    `/api/wallet/waiv/generated-reports/${encodeURIComponent(reportId)}/rows/${operationIndex}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked }),
    },
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: true, data: await parseJson(response) };
}

export async function deleteWaivGeneratedReportClient(
  reportId: string,
): Promise<{ ok: true } | { ok: false; reason: 'unauthorized' | 'unavailable' }> {
  const response = await fetch(
    `/api/wallet/waiv/generated-reports/${encodeURIComponent(reportId)}`,
    { method: 'DELETE' },
  );
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (response.status === 204 || response.ok) {
    return { ok: true };
  }
  return { ok: false, reason: 'unavailable' };
}
