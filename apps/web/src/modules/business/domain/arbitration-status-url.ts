export const ARBITRATION_STATUSES = ['open', 'resolved'] as const;

export type ArbitrationStatus = (typeof ARBITRATION_STATUSES)[number];

const ARBITRATION_PATH = '/business/arbitration';
const DEFAULT_STATUS: ArbitrationStatus = 'open';

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

export function isArbitrationStatus(value: string): value is ArbitrationStatus {
  return (ARBITRATION_STATUSES as readonly string[]).includes(value);
}

export function parseArbitrationStatus(source: SearchParamsSource): ArbitrationStatus {
  const raw = readSearchParam(source, 'status')?.trim().toLowerCase();
  if (raw && isArbitrationStatus(raw)) {
    return raw;
  }
  return DEFAULT_STATUS;
}

export function buildArbitrationHref(status: ArbitrationStatus = DEFAULT_STATUS): string {
  if (status === DEFAULT_STATUS) {
    return ARBITRATION_PATH;
  }
  const search = new URLSearchParams({ status });
  return `${ARBITRATION_PATH}?${search.toString()}`;
}
