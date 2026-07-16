import { businessRoutes } from './routes';

export const RELATIONSHIP_TABS = [
  'payments',
  'contracts',
  'invoices',
  'disputes',
] as const;

export type RelationshipTab = (typeof RELATIONSHIP_TABS)[number];

const DEFAULT_TAB: RelationshipTab = 'payments';

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

export function isRelationshipTab(value: string): value is RelationshipTab {
  return (RELATIONSHIP_TABS as readonly string[]).includes(value);
}

export function parseRelationshipTab(source: SearchParamsSource): RelationshipTab {
  const raw = readSearchParam(source, 'tab')?.trim().toLowerCase();
  if (raw && isRelationshipTab(raw)) {
    return raw;
  }
  return DEFAULT_TAB;
}

export function buildRelationshipTabHref(
  account: string,
  tab: RelationshipTab = DEFAULT_TAB,
): string {
  const base = businessRoutes.relationship(account);
  if (tab === DEFAULT_TAB) {
    return base;
  }
  const search = new URLSearchParams({ tab });
  return `${base}?${search.toString()}`;
}
