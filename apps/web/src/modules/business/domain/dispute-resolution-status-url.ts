export const DISPUTE_RESOLUTION_STATUSES = ['open', 'resolved'] as const;

export type DisputeResolutionStatus = (typeof DISPUTE_RESOLUTION_STATUSES)[number];

const DISPUTE_RESOLUTION_PATH = '/business/dispute-resolution';
const DEFAULT_STATUS: DisputeResolutionStatus = 'open';

type SearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(source: SearchParamsSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const value = source[key];
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function isDisputeResolutionStatus(
  value: string,
): value is DisputeResolutionStatus {
  return (DISPUTE_RESOLUTION_STATUSES as readonly string[]).includes(value);
}

export function parseDisputeResolutionStatus(
  source: SearchParamsSource,
): DisputeResolutionStatus {
  const raw = readSearchParam(source, 'status')?.trim().toLowerCase();
  if (raw && isDisputeResolutionStatus(raw)) {
    return raw;
  }
  return DEFAULT_STATUS;
}

export function buildDisputeResolutionHref(
  status: DisputeResolutionStatus = DEFAULT_STATUS,
): string {
  if (status === DEFAULT_STATUS) {
    return DISPUTE_RESOLUTION_PATH;
  }
  const search = new URLSearchParams({ status });
  return `${DISPUTE_RESOLUTION_PATH}?${search.toString()}`;
}
